import pool from '../config/db.js';
import { insertContractHistory } from '../controllers/contract.controller.js';

// ─── Type-specific cascade tables ────────────────────────────────────────
// Key = `${statutMandat}::${statutMetier}` (or `${mandatStatus}::*` for wildcard)
// Values use the exact ASCII strings sent by the frontend (no accents).

const ACHETEUR_CASCADE = {
  'Non défini::En qualification':              { tx: null,           reg: null,                      ctr: null },
  'En attente de signature::En qualification': { tx: 'en_attente',   reg: null,                      ctr: null },
  'Actif::En recherche':                       { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En negociation':                     { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En négociation':                     { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En compromis':                       { tx: 'actif',        reg: { etape: 'reservation' },  ctr: { type: 'vente', status: 'en_cours' } },
  'Termine::Vendu / Achete':                   { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: { type: 'vente', status: 'finalise_termine' } },
  'Termine::Vendu / Acheté':                   { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: { type: 'vente', status: 'finalise_termine' } },
  'Expire::Inactif':                           { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
  'Resilie::Perdu':                            { tx: 'resilie',      reg: { etape: 'resilie' },      ctr: null },
  'Non défini::*':                             { tx: null,           reg: null,                      ctr: null },
  'En attente de signature::*':                { tx: 'en_attente',   reg: null,                      ctr: null },
  'Expire::*':                                 { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
  'Resilie::*':                                { tx: 'resilie',      reg: { etape: 'resilie' },      ctr: null },
  'Termine::*':                                { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: null },
  'Actif::*':                                  { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
};

// ─── Vendeur ──────────────────────────────────────────────────────────────
// Frontend: statutMetier is editable when mandat is Actif.
// Mandat → Metier auto-derivation: Non défini→En attente de signature,
// Termine→Vendu, Expire→Inactif, Resilie→Perdu.
// When Actif, user chooses: En mandat | En négociation | En compromis.
// Registre type = mandatType (Simple, Exclusif, etc.) passed via param.
const VENDEUR_CASCADE = {
  'Non défini::En attente de signature':             { tx: null,           reg: null,                      ctr: null },
  'En attente de signature::En attente de signature': { tx: 'en_attente',  reg: null,                      ctr: null },
  'Actif::En mandat':                                { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En negociation':                           { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En négociation':                           { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En compromis':                             { tx: 'actif',        reg: { etape: 'reservation' },  ctr: { type: 'vente', status: 'en_cours' } },
  'Termine::Vendu':                                  { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: { type: 'vente', status: 'finalise_termine' } },
  'Expire::Inactif':                                 { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
  'Resilie::Perdu':                                  { tx: 'resilie',      reg: { etape: 'resilie' },      ctr: null },
  // Wildcard fallbacks for any unmapped mandat+metier combos
  'Non défini::*':                                   { tx: null,           reg: null,                      ctr: null },
  'En attente de signature::*':                      { tx: 'en_attente',   reg: null,                      ctr: null },
  'Actif::*':                                        { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Termine::*':                                      { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: null },
  'Expire::*':                                       { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
  'Resilie::*':                                      { tx: 'resilie',      reg: { etape: 'resilie' },      ctr: null },
};

// ─── Bailleur ─────────────────────────────────────────────────────────────
// Frontend: statutMetier is editable when mandat is Actif.
// Mandat → Metier auto-derivation: Non défini→En attente de signature,
// Termine→Loue, Expire→Inactif, Resilie→Perdu.
// When Actif, user chooses: En mandat | En négociation | En location.
// Registre type is always 'location_gestion'.
const BAILLEUR_CASCADE = {
  'Non défini::En attente de signature':       { tx: null,           reg: null,                      ctr: null },
  'En attente de signature::En attente de signature': { tx: 'en_attente', reg: null,                 ctr: null },
  'Actif::En mandat':                          { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En negociation':                     { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En négociation':                     { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En location':                        { tx: 'actif',        reg: { etape: 'reservation' },  ctr: { type: 'location_classique', status: 'en_cours' } },
  'Termine::Loue':                             { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: { type: 'location_classique', status: 'finalise_termine' } },
  'Expire::Inactif':                           { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
  'Resilie::Perdu':                            { tx: 'resilie',      reg: { etape: 'resilie' },      ctr: null },
  // Wildcard fallbacks
  'Non défini::*':                             { tx: null,           reg: null,                      ctr: null },
  'En attente de signature::*':                { tx: 'en_attente',   reg: null,                      ctr: null },
  'Actif::*':                                  { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Termine::*':                                { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: null },
  'Expire::*':                                 { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
  'Resilie::*':                                { tx: 'resilie',      reg: { etape: 'resilie' },      ctr: null },
};

// ─── Locataire ────────────────────────────────────────────────────────────
// Frontend: statutMetier is editable when mandat is Actif.
// Mandat → Metier auto-derivation: Non défini→En recherche,
// En attente de signature→En recherche, Termine→Installe, Expire→Inactif, Resilie→Perdu.
// When Actif, user chooses: En visite | En dossier | Bail signe.
// Registre type is always 'recherche_location'.
const LOCATAIRE_CASCADE = {
  'Non défini::En recherche':               { tx: null,           reg: null,                      ctr: null },
  'En attente de signature::En recherche':  { tx: 'en_attente',   reg: null,                      ctr: null },
  'Actif::En visite':                       { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::En dossier':                      { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Actif::Bail signe':                      { tx: 'actif',        reg: { etape: 'reservation' },  ctr: { type: 'location_classique', status: 'en_cours' } },
  'Termine::Installe':                      { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: { type: 'location_classique', status: 'finalise_termine' } },
  'Expire::Inactif':                        { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
  'Resilie::Perdu':                         { tx: 'resilie',      reg: { etape: 'resilie' },      ctr: null },
  // Wildcard fallbacks
  'Non défini::*':                          { tx: null,           reg: null,                      ctr: null },
  'En attente de signature::*':             { tx: 'en_attente',   reg: null,                      ctr: null },
  'Actif::*':                               { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Termine::*':                             { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: null },
  'Expire::*':                              { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
  'Resilie::*':                             { tx: 'resilie',      reg: { etape: 'resilie' },      ctr: null },
};

// ─── Voyageur ─────────────────────────────────────────────────────────────
// Voyageur uses statutReservation → statutMandat mapping.
// Frontend sends accented mandat values: 'Terminé', 'Annulé'.
// statutMetier is auto-derived from statutReservation.
// Registre type is always 'location_saisonniere', contract type always 'location_saisonniere'.
const VOYAGEUR_CASCADE = {
  'Brouillon::En recherche':              { tx: null,           reg: null,                      ctr: null },
  'En attente::Reservation en cours':     { tx: 'actif',        reg: { etape: 'reservation' },  ctr: { type: 'location_saisonniere', status: 'en_cours' } },
  'En attente::Réservation en cours':     { tx: 'actif',        reg: { etape: 'reservation' },  ctr: { type: 'location_saisonniere', status: 'en_cours' } },
  'Actif::Confirme':                      { tx: 'actif',        reg: { etape: 'signe' },        ctr: { type: 'location_saisonniere', status: 'confirme_actif' } },
  'Actif::Confirmé':                      { tx: 'actif',        reg: { etape: 'signe' },        ctr: { type: 'location_saisonniere', status: 'confirme_actif' } },
  'Actif::Paye':                          { tx: 'actif',        reg: { etape: 'signe' },        ctr: { type: 'location_saisonniere', status: 'paye' } },
  'Actif::Payé':                          { tx: 'actif',        reg: { etape: 'signe' },        ctr: { type: 'location_saisonniere', status: 'paye' } },
  'Actif::En sejour':                     { tx: 'actif',        reg: { etape: 'actif' },        ctr: { type: 'location_saisonniere', status: 'occupe' } },
  'Actif::En séjour':                     { tx: 'actif',        reg: { etape: 'actif' },        ctr: { type: 'location_saisonniere', status: 'occupe' } },
  'Terminé::Termine':                     { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: { type: 'location_saisonniere', status: 'finalise_termine' } },
  'Terminé::Terminé':                     { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: { type: 'location_saisonniere', status: 'finalise_termine' } },
  'Annulé::Annule':                       { tx: 'resilie',      reg: { etape: 'annule' },       ctr: { type: 'location_saisonniere', status: 'annule' } },
  'Annulé::Annulé':                       { tx: 'resilie',      reg: { etape: 'annule' },       ctr: { type: 'location_saisonniere', status: 'annule' } },
  'Inactif::Inactif':                     { tx: 'expire',       reg: { etape: 'annule' },       ctr: { type: 'location_saisonniere', status: 'annule' } },
  // Wildcard fallbacks
  'Brouillon::*':                         { tx: null,           reg: null,                      ctr: null },
  'En attente::*':                        { tx: 'actif',        reg: { etape: 'reservation' },  ctr: null },
  'Actif::*':                             { tx: 'actif',        reg: { etape: 'actif' },        ctr: null },
  'Terminé::*':                           { tx: 'cloture',      reg: { etape: 'cloture' },      ctr: null },
  'Annulé::*':                            { tx: 'resilie',      reg: { etape: 'annule' },       ctr: null },
  'Inactif::*':                           { tx: 'expire',       reg: { etape: 'expire' },       ctr: null },
};

// ─── Cascade resolver by client type ──────────────────────────────────────
function resolveCascade(statutMandat, statutMetier, clientType) {
  const key = `${statutMandat || ''}::${statutMetier || ''}`;
  const mandatOnlyKey = `${statutMandat || ''}::*`;

  let cascadeMap;
  switch ((clientType || '').toLowerCase()) {
    case 'acheteur':   cascadeMap = ACHETEUR_CASCADE;   break;
    case 'vendeur':    cascadeMap = VENDEUR_CASCADE;    break;
    case 'bailleur':   cascadeMap = BAILLEUR_CASCADE;   break;
    case 'locataire':  cascadeMap = LOCATAIRE_CASCADE;  break;
    case 'voyageur':   cascadeMap = VOYAGEUR_CASCADE;   break;
    default:           cascadeMap = VENDEUR_CASCADE;    break;
  }

  // Try exact key first (mandat + metier)
  if (cascadeMap[key] !== undefined) return cascadeMap[key];

  // Fallback: mandat-only wildcard
  if (cascadeMap[mandatOnlyKey] !== undefined) return cascadeMap[mandatOnlyKey];

  return null;
}

// ─── Reference maps ──────────────────────────────────────────────────────
const CLIENT_TYPE_TO_TRANSACTION_TYPE = {
  'Vendeur': 'exclusif',
  'Acheteur': 'recherche_achat',
  'Bailleur': 'location_gestion',
  'Locataire': 'recherche_location',
  'Voyageur': 'location_saisonniere',
};

const CLIENT_TYPE_TO_CONTRACT_TYPE = {
  'Vendeur': 'vente',
  'Acheteur': 'vente',
  'Bailleur': 'location_classique',
  'Locataire': 'location_classique',
  'Voyageur': 'location_saisonniere',
};

const REGISTRE_TYPE_BY_CLIENT_TYPE = {
  'Vendeur': 'vente',
  'Acheteur': 'recherche_achat',
  'Bailleur': 'location_gestion',
  'Locataire': 'recherche_location',
  'Voyageur': 'location_saisonniere',
};

export async function generateReference(prefix, client, db) {
  const conn = db || pool;
  const year = new Date().getFullYear();
  const likePattern = `${prefix}-${year}-%`;

  const result = await conn.query(
    `SELECT reference FROM transactions WHERE reference LIKE $1
     UNION ALL
     SELECT reference FROM registre WHERE reference LIKE $1
     UNION ALL
     SELECT reference FROM contracts WHERE reference LIKE $1`,
    [likePattern]
  );

  let maxNum = 0;
  for (const row of result.rows) {
    const ref = row.reference;
    if (ref) {
      const numPart = ref.split('-').pop();
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`;
}

// ─── Mandat type → Registre type mapping ────────────────────────────────
const MANDAT_TYPE_TO_REGISTRE_TYPE = {
  'Simple':           'simple',
  'Co-exclusif':      'co_exclusif',
  'Exclusif':         'exclusif',
  'Exclusif agence':  'exclusif_agence',
  'Delegation':       'delegation',
  'Confrere':         'confrere',
};

// ─── onClientStatusChange ────────────────────────────────────────────────
export async function onClientStatusChange(
  clientId,
  statutMandat,
  statutMetier,
  clientType,
  clientName,
  agentName,
  agentId,
  db,
  mandatType
) {
  const conn = db || pool;

  const cascade = resolveCascade(statutMandat, statutMetier, clientType);

  if (!cascade) return;

  const isAcheteur = (clientType || '').toLowerCase() === 'acheteur';
  const isVendeur = (clientType || '').toLowerCase() === 'vendeur';

  // ── Transaction ──────────────────────────────────────────────────────
  if (cascade.tx !== null) {
    let txType = CLIENT_TYPE_TO_TRANSACTION_TYPE[clientType] || 'exclusif';
    if (isVendeur && mandatType) {
      txType = MANDAT_TYPE_TO_REGISTRE_TYPE[mandatType] || mandatType.toLowerCase().replace(/[\s-]/g, '_');
    }

    const { rows: existingTx } = await conn.query(
      `SELECT id FROM transactions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [clientId]
    );

    if (existingTx.length > 0) {
      await conn.query(
        `UPDATE transactions SET etape = $1, type = $2, updated_at = NOW() WHERE id = $3`,
        [cascade.tx, txType, existingTx[0].id]
      );
    } else {
      const txRef = await generateReference('MVT', null, conn);
      await conn.query(
        `INSERT INTO transactions (reference, client_id, client_name, client_type, type, etape, role, agent_name, agent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [txRef, clientId, clientName, clientType, txType, cascade.tx, clientType, agentName, agentId]
      );
    }
  }

  // ── Registre ─────────────────────────────────────────────────────────
  if (cascade.reg !== null) {
    let regType;
    if (isVendeur && mandatType) {
      regType = MANDAT_TYPE_TO_REGISTRE_TYPE[mandatType] || mandatType.toLowerCase().replace(/[\s-]/g, '_');
    } else if (isAcheteur) {
      regType = 'recherche_achat';
    } else {
      regType = REGISTRE_TYPE_BY_CLIENT_TYPE[clientType] || null;
    }

    const { rows: existingReg } = await conn.query(
      `SELECT id FROM registre WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [clientId]
    );

    if (existingReg.length > 0) {
      await conn.query(
        `UPDATE registre SET etape = $1, type = $2, updated_at = NOW() WHERE id = $3`,
        [cascade.reg.etape, regType, existingReg[0].id]
      );
    } else {
      const regRef = await generateReference('REG', null, conn);
      await conn.query(
        `INSERT INTO registre (reference, client_id, client_name, client_type, type, etape, role, agent_name, agent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [regRef, clientId, clientName, clientType, regType, cascade.reg.etape, clientType, agentName, agentId]
      );
    }
  }

  // ── Contrat ──────────────────────────────────────────────────────────
  if (cascade.ctr !== null) {
    const { rows: existingCtr } = await conn.query(
      `SELECT id FROM contracts WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [clientId]
    );

    if (existingCtr.length > 0) {
      await conn.query(
        `UPDATE contracts SET status = $1, contract_type = $2, updated_at = NOW() WHERE id = $3`,
        [cascade.ctr.status, cascade.ctr.type, existingCtr[0].id]
      );
      insertContractHistory(
        conn, existingCtr[0].id, 'Changement de statut',
        `Statut mis à jour : ${cascade.ctr.status}`, agentName || 'Système'
      );
    } else {
      const ctrRef = await generateReference('CTR', null, conn);
      const { rows: newCtr } = await conn.query(
        `INSERT INTO contracts (reference, client_id, client_name, client_type, contract_type, status, agent_name, agent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id`,
        [ctrRef, clientId, clientName, clientType, cascade.ctr.type, cascade.ctr.status, agentName, agentId]
      );
      insertContractHistory(
        conn, newCtr[0].id, 'Contrat créé', `Contrat ${ctrRef} créé`, agentName || 'Système'
      );
    }
  }

  // ── Always sync tx/reg TYPE with mandatType (Vendeur) ──────────────
  // Even when the cascade mapping has tx:null/reg:null, existing records
  // should reflect the current mandatType.
  if (isVendeur && mandatType) {
    const syncType = MANDAT_TYPE_TO_REGISTRE_TYPE[mandatType] || mandatType.toLowerCase().replace(/[\s-]/g, '_');
    await conn.query(
      `UPDATE transactions SET type = $1, updated_at = NOW() WHERE client_id = $2 AND type IS DISTINCT FROM $1`,
      [syncType, clientId]
    );
    await conn.query(
      `UPDATE registre SET type = $1, updated_at = NOW() WHERE client_id = $2 AND type IS DISTINCT FROM $1`,
      [syncType, clientId]
    );
  }
}

export async function onMandatSigned(
  clientId,
  clientType,
  clientName,
  propertyId,
  propertyTitle,
  propertyRef,
  agentName,
  agentId,
  mandatType,
  montant,
  dateExpiration,
  db
) {
  const conn = db || pool;

  const { rows: existingTx } = await conn.query(
    `SELECT id FROM transactions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  if (existingTx.length > 0) {
    await conn.query(
      `UPDATE transactions SET etape = 'actif', property_id = $1, property_title = $2, property_ref = $3, montant = $4, date_expiration = $5, updated_at = NOW() WHERE id = $6`,
      [propertyId, propertyTitle, propertyRef, montant, dateExpiration, existingTx[0].id]
    );
  } else {
    const txRef = await generateReference('MVT', null, conn);
    const txType = CLIENT_TYPE_TO_TRANSACTION_TYPE[clientType] || 'exclusif';
    await conn.query(
      `INSERT INTO transactions (reference, client_id, client_name, client_type, type, etape, role, property_id, property_title, property_ref, montant, date_expiration, agent_name, agent_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'actif', $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
      [txRef, clientId, clientName, clientType, txType, clientType, propertyId, propertyTitle, propertyRef, montant, dateExpiration, agentName, agentId]
    );
  }

  const { rows: existingReg } = await conn.query(
    `SELECT id FROM registre WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  if (existingReg.length > 0) {
    await conn.query(
      `UPDATE registre SET etape = 'actif', updated_at = NOW() WHERE id = $1`,
      [existingReg[0].id]
    );
  } else {
    const regRef = await generateReference('REG', null, conn);
    await conn.query(
      `INSERT INTO registre (reference, client_id, client_name, client_type, etape, role, property_id, property_title, property_ref, agent_name, agent_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'actif', $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [regRef, clientId, clientName, clientType, clientType, propertyId, propertyTitle, propertyRef, agentName, agentId]
    );
  }
}

export async function onMandatResiliated(clientId, agentName, agentId, db) {
  const conn = db || pool;

  await conn.query(
    `UPDATE transactions SET etape = 'resilie', updated_at = NOW() WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  await conn.query(
    `UPDATE registre SET etape = 'resilie', updated_at = NOW() WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  await conn.query(
    `UPDATE owner_clients SET statut_metier = 'Perdu', updated_at = NOW() WHERE id = $1`,
    [clientId]
  );
}

export async function onMandatExpired(clientId, agentName, agentId, db) {
  const conn = db || pool;

  await conn.query(
    `UPDATE transactions SET etape = 'expire', updated_at = NOW() WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  await conn.query(
    `UPDATE registre SET etape = 'expire', updated_at = NOW() WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  await conn.query(
    `UPDATE owner_clients SET statut_metier = 'Inactif', updated_at = NOW() WHERE id = $1`,
    [clientId]
  );
}

async function resolveAgentName(conn, agentId, fallback) {
  const rawId = agentId != null ? String(agentId) : '';
  if (!rawId) return fallback || '';
  // When agentId is a numeric user id, prefer the users-table name so the
  // registre/contract agent matches the agent shown in the register filters.
  if (/^\d+$/.test(rawId)) {
    try {
      const { rows } = await conn.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [rawId]
      );
      if (rows.length > 0) {
        const name = [rows[0].first_name, rows[0].last_name].filter(Boolean).join(' ').trim();
        if (name) return name;
      }
    } catch (error) {
      console.error('Error resolving agent name:', error);
    }
  }
  return fallback || rawId;
}

export async function onVoyageurReservationCreated(
  clientId,
  clientName,
  propertyId,
  propertyTitle,
  propertyRef,
  agentName,
  agentId,
  montant,
  startDate,
  endDate,
  db
) {
  const conn = db || pool;

  const resolvedAgentName = await resolveAgentName(conn, agentId, agentName);

  const ctrRef = await generateReference('CTR', null, conn);
  const { rows: newCtr } = await conn.query(
    `INSERT INTO contracts (reference, client_id, client_name, client_type, contract_type, status, property_id, property_title, property_ref, amount, start_date, end_date, agent_name, agent_id, created_at, updated_at)
     VALUES ($1, $2, $3, 'Voyageur', 'location_saisonniere', 'en_cours', $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
     RETURNING id`,
    [ctrRef, clientId, clientName, propertyId, propertyTitle, propertyRef, montant, startDate, endDate, resolvedAgentName, agentId]
  );
  insertContractHistory(
    conn, newCtr[0].id, 'Contrat créé',
    `Contrat ${ctrRef} créé — ${propertyTitle || 'location saisonnière'}`,
    resolvedAgentName || 'Système'
  );

  const { rows: existingReg } = await conn.query(
    `SELECT id FROM registre WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  if (existingReg.length > 0) {
    await conn.query(
      `UPDATE registre SET etape = 'reservation', type = 'location_saisonniere',
         property_id = COALESCE($1, property_id), property_title = COALESCE($2, property_title),
         property_ref = COALESCE($3, property_ref), date_expiration = COALESCE($4, date_expiration),
         montant = COALESCE($5, montant), agent_name = COALESCE($6, agent_name),
         agent_id = COALESCE($7, agent_id), date_contrat = COALESCE(date_contrat, CURRENT_DATE),
         updated_at = NOW() WHERE id = $8`,
      [propertyId, propertyTitle, propertyRef, endDate, montant, resolvedAgentName, agentId, existingReg[0].id]
    );
  } else {
    const regRef = await generateReference('REG', null, conn);
    await conn.query(
      `INSERT INTO registre (reference, client_id, client_name, client_type, type, etape, role, property_id, property_title, property_ref, montant, agent_name, agent_id, date_contrat, date_expiration, created_at, updated_at)
       VALUES ($1, $2, $3, 'Voyageur', 'location_saisonniere', 'reservation', $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE, $12, NOW(), NOW())`,
      [regRef, clientId, clientName, 'Voyageur', propertyId, propertyTitle, propertyRef, montant, resolvedAgentName, agentId, endDate]
    );
  }
}

export async function onVoyageurReservationConfirmed(clientId, db) {
  const conn = db || pool;

  const { rows: ctr } = await conn.query(
    `SELECT id, status FROM contracts WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  await conn.query(
    `UPDATE contracts SET status = 'confirme_actif', updated_at = NOW() WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  if (ctr.length > 0) {
    insertContractHistory(
      conn, ctr[0].id, 'Changement de statut',
      `Réservation confirmée — statut passé de "${ctr[0].status || 'en_cours'}" à "confirme_actif"`,
      'Système'
    );
  }

  await conn.query(
    `UPDATE registre SET etape = 'signe', updated_at = NOW() WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );
}

export async function onVoyageurReservationCancelled(clientId, db) {
  const conn = db || pool;

  const { rows: ctr } = await conn.query(
    `SELECT id, status FROM contracts WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  await conn.query(
    `UPDATE contracts SET status = 'annule', updated_at = NOW() WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  if (ctr.length > 0) {
    insertContractHistory(
      conn, ctr[0].id, 'Changement de statut',
      `Réservation annulée — statut passé de "${ctr[0].status || 'en_cours'}" à "annule"`,
      'Système'
    );
  }

  await conn.query(
    `UPDATE registre SET etape = 'annule', updated_at = NOW() WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );
}

export {
  CLIENT_TYPE_TO_TRANSACTION_TYPE,
  CLIENT_TYPE_TO_CONTRACT_TYPE,
};
