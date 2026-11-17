/**
 * Seed mock registre + transactions rows so the "Registre des mandats"
 * page has rich, realistic demo data to modernize.
 *
 * Guarded & idempotent: skipped if either table already has rows.
 * Run:  node seed-mock-registre.cjs
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Pool } = require('pg');

// Lax-pass DB settings from src/backend/.env (dotenv lives in the ESM app).
const here = path.dirname(fileURLToPath(import.meta.url));
const env = readFileSync(path.join(here, '.env'), 'utf8');
const cfg = {};
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) cfg[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const pool = new Pool({
  user: cfg.DB_USER,
  password: cfg.DB_PASSWORD,
  host: cfg.DB_HOST || 'localhost',
  port: parseInt(cfg.DB_PORT || '5432', 10),
  database: cfg.DB_NAME,
});

const AGENT_SLAOUI = { id: '6', name: 'Slaoui Mohamed' };
const AGENT_RIDA = { id: '5', name: 'Elhiri Rida' };

// Cross-linked mandate register: client ids reference owner_clients,
// property 1 = Villa Marrakesh (RES-2026-001). Montants are numeric strings.
const TRANSACTIONS = [
  { ref: 'MVT-2026-001', clientId: 5,  clientName: 'Rachid El Fassi',           clientType: 'Vendeur',    propId: 1, propTitle: 'Villa Marrakesh',                propRef: 'RES-2026-001', type: 'exclusif',         etape: 'actif',      role: 'Vendeur',    montant: '8500000', agent: AGENT_SLAOUI, contracted: '2026-01-10', expiration: '2027-01-10', created: '2026-01-10 10:30:00', notes: 'Mandat de vente exclusif — Villa Marrakesh, quartier Hivernage.' },
  { ref: 'MVT-2026-002', clientId: 1,  clientName: 'Yasmine El Amrani',         clientType: 'Acheteur',   propId: null, propTitle: '',                            propRef: '', type: 'recherche_achat',  etape: 'actif',      role: 'Acquéreur',  montant: '9000000', agent: AGENT_SLAOUI, contracted: '2026-01-20', expiration: null, created: '2026-01-20 09:15:00', notes: 'Recherche villa avec piscine à Marrakech, budget jusqu\'à 9 M MAD.' },
  { ref: 'MVT-2026-003', clientId: 2,  clientName: 'Julien Moreau',             clientType: 'Acheteur',   propId: null, propTitle: '',                            propRef: '', type: 'recherche_achat',  etape: 'actif',      role: 'Acquéreur',  montant: '7000000', agent: AGENT_SLAOUI, contracted: '2026-03-01', expiration: null, created: '2026-03-01 14:00:00', notes: 'Acheteur étranger, mobilité flexible sur le quartier.' },
  { ref: 'MVT-2026-004', clientId: 3,  clientName: 'Salma & Mehdi Benjelloun',  clientType: 'Acheteur',   propId: null, propTitle: '',                            propRef: '', type: 'recherche_achat',  etape: 'reservation', role: 'Acquéreur', montant: '6500000', agent: AGENT_SLAOUI, contracted: '2026-04-12', expiration: null, created: '2026-04-12 11:45:00', notes: 'Compromis signé le 12/04 — financement en cours.' },
  { ref: 'MVT-2026-005', clientId: 4,  clientName: 'Omar Chraibi',              clientType: 'Acheteur',   propId: null, propTitle: '',                            propRef: '', type: 'recherche_achat',  etape: 'reservation', role: 'Acquéreur', montant: '8200000', agent: AGENT_SLAOUI, contracted: '2026-05-06', expiration: null, created: '2026-05-06 16:20:00', notes: 'Offre déposée sur Villa Marrakesh — inscriptions des garanties à suivre.' },
  { ref: 'MVT-2026-006', clientId: 6,  clientName: 'Claire Fontaine',           clientType: 'Vendeur',    propId: null, propTitle: 'Appartement Anfa - Casablanca', propRef: 'RES-2026-007', type: 'simple',         etape: 'en_attente', role: 'Vendeur',    montant: '4300000', agent: AGENT_SLAOUI, contracted: '2026-05-20', expiration: null, created: '2026-05-20 10:05:00', notes: 'Mandat simple en attente de signature du bailleur de la copropriété.' },
  { ref: 'MVT-2026-007', clientId: 9,  clientName: 'Moulay Driss Alaoui',       clientType: 'Bailleur',   propId: null, propTitle: 'Penthouse au bord de mer',     propRef: 'VAC-2026-009', type: 'location_gestion', etape: 'actif',    role: 'Bailleur',   montant: '18000',   agent: AGENT_SLAOUI, contracted: '2026-03-10', expiration: '2027-03-10', created: '2026-03-10 09:40:00', notes: 'Gestion locative complète — penthouse 120 m², front de mer.' },
  { ref: 'MVT-2026-008', clientId: 7,  clientName: 'Hicham Bennis',             clientType: 'Vendeur',    propId: null, propTitle: 'Riad Sidi Yacoub',             propRef: 'RES-2026-014', type: 'co_exclusif',      etape: 'actif',     role: 'Vendeur',    montant: '12000000', agent: AGENT_SLAOUI, contracted: '2026-02-02', expiration: '2027-02-02', created: '2026-02-02 10:55:00', notes: 'Co-exclusivité avec l\'agence partenaire Kasbah Estates.' },
  { ref: 'MVT-2026-009', clientId: 8,  clientName: 'Nadia Othmani',             clientType: 'Vendeur',    propId: null, propTitle: 'Duplex Gauthier',              propRef: 'RES-2026-012', type: 'simple',           etape: 'cloture',   role: 'Vendeur',    montant: '3900000', agent: AGENT_RIDA,   contracted: '2025-11-05', expiration: '2026-05-05', created: '2025-11-05 11:10:00', notes: 'Vente finalisée le 08/05/2026 devant notaire à Casablanca.' },
  { ref: 'MVT-2026-010', clientId: 12, clientName: 'Karim Tazi',                clientType: 'Bailleur',   propId: null, propTitle: 'Local commercial Maârif',      propRef: 'CCE-2026-004', type: 'location_gestion', etape: 'resilie',   role: 'Bailleur',   montant: '25000',   agent: AGENT_RIDA,   contracted: '2025-12-10', expiration: '2026-06-10', created: '2025-12-10 15:30:00', notes: 'Mandat résilié prématurément à la demande du bailleur.' },
  { ref: 'MVT-2026-011', clientId: 15, clientName: 'Yassine Ouazzani',          clientType: 'Locataire',  propId: null, propTitle: '',                            propRef: '', type: 'recherche_location', etape: 'expire',   role: 'Locataire',  montant: '14000',   agent: AGENT_RIDA,   contracted: '2026-01-05', expiration: '2026-07-05', created: '2026-01-05 08:50:00', notes: 'Recherche studio Beauséjour — mandat arrivé à échéance.' },
];

const REGISTRE = [
  { ref: 'REG-2026-001', client: 8,  tRef: 'MVT-2026-009',  clientName: 'Nadia Othmani',            clientType: 'Vendeur',   propId: null, propTitle: 'Duplex Gauthier',            propRef: 'RES-2026-012', type: 'simple',           etape: 'cloture',   role: 'Vendeur',    montant: '3900000', agent: AGENT_RIDA,   contrat: '2025-11-05', expiration: '2026-05-05', created: '2025-11-05 11:12:00', notes: 'Vente finalisée le 08/05/2026 devant notaire à Casablanca.' },
  { ref: 'REG-2026-002', client: 12, tRef: 'MVT-2026-010',  clientName: 'Karim Tazi',               clientType: 'Bailleur',  propId: null, propTitle: 'Local commercial Maârif',    propRef: 'CCE-2026-004', type: 'location_gestion', etape: 'resilie',   role: 'Bailleur',   montant: '25000',   agent: AGENT_RIDA,   contrat: '2025-12-10', expiration: '2026-06-10', created: '2025-12-10 15:32:00', notes: 'Mandat résilié prématurément à la demande du bailleur.' },
  { ref: 'REG-2026-003', client: 5,  tRef: 'MVT-2026-001',  clientName: 'Rachid El Fassi',          clientType: 'Vendeur',   propId: 1,    propTitle: 'Villa Marrakesh',            propRef: 'RES-2026-001', type: 'exclusif',         etape: 'actif',     role: 'Vendeur',    montant: '8500000', agent: AGENT_SLAOUI, contrat: '2026-01-10', expiration: '2027-01-10', created: '2026-01-10 10:32:00', notes: 'Mandat de vente exclusif — Villa Marrakesh, quartier Hivernage.' },
  { ref: 'REG-2026-004', client: 1,  tRef: 'MVT-2026-002',  clientName: 'Yasmine El Amrani',        clientType: 'Acheteur',  propId: null, propTitle: '',                           propRef: '', type: 'recherche_achat',  etape: 'actif',     role: 'Acquéreur',  montant: '9000000', agent: AGENT_SLAOUI, contrat: '2026-01-20', expiration: null, created: '2026-01-20 09:18:00', notes: 'Recherche villa avec piscine à Marrakech, budget jusqu\'à 9 M MAD.' },
  { ref: 'REG-2026-005', client: 7,  tRef: 'MVT-2026-008',  clientName: 'Hicham Bennis',            clientType: 'Vendeur',   propId: null, propTitle: 'Riad Sidi Yacoub',           propRef: 'RES-2026-014', type: 'co_exclusif',      etape: 'actif',     role: 'Vendeur',    montant: '12000000', agent: AGENT_SLAOUI, contrat: '2026-02-02', expiration: '2027-02-02', created: '2026-02-02 10:57:00', notes: 'Co-exclusivité avec l\'agence partenaire Kasbah Estates.' },
  { ref: 'REG-2026-006', client: 13, tRef: null,            clientName: 'Anas Berrada',             clientType: 'Locataire', propId: null, propTitle: '',                           propRef: '', type: 'recherche_location', etape: 'actif',   role: 'Locataire',  montant: '14000',   agent: AGENT_SLAOUI, contrat: '2026-02-15', expiration: null, created: '2026-02-15 13:25:00', notes: 'Recherche appartement dans la médina, préfère Mogador.' },
  { ref: 'REG-2026-007', client: 2,  tRef: 'MVT-2026-003',  clientName: 'Julien Moreau',            clientType: 'Acheteur',  propId: null, propTitle: '',                           propRef: '', type: 'recherche_achat',  etape: 'actif',     role: 'Acquéreur',  montant: '7000000', agent: AGENT_SLAOUI, contrat: '2026-03-01', expiration: null, created: '2026-03-01 14:02:00', notes: 'Acheteur étranger, mobilité flexible sur le quartier.' },
  { ref: 'REG-2026-008', client: 9,  tRef: 'MVT-2026-007',  clientName: 'Moulay Driss Alaoui',      clientType: 'Bailleur',  propId: null, propTitle: 'Penthouse au bord de mer',   propRef: 'VAC-2026-009', type: 'location_gestion', etape: 'actif',     role: 'Bailleur',   montant: '18000',   agent: AGENT_SLAOUI, contrat: '2026-03-10', expiration: '2027-03-10', created: '2026-03-10 09:42:00', notes: 'Gestion locative complète — penthouse 120 m², front de mer.' },
  { ref: 'REG-2026-009', client: 14, tRef: null,            clientName: 'Élise Dubois',             clientType: 'Locataire', propId: null, propTitle: 'Appartement 2 pièces Gauthier', propRef: 'RES-2026-019', type: 'recherche_location', etape: 'reservation', role: 'Locataire', montant: '14500', agent: AGENT_SLAOUI, contrat: '2026-03-22', expiration: null, created: '2026-03-22 10:08:00', notes: 'Dossier validé — bail en cours de signature, entrée prévue en mai.' },
  { ref: 'REG-2026-010', client: 18, tRef: null,            clientName: 'Charlotte Lefèvre',        clientType: 'Voyageur',  propId: null, propTitle: 'Séjours villa Marrakech',    propRef: 'VAC-2026-004', type: 'location_saisonniere', etape: 'signe',   role: 'Voyageur',   montant: '2250',    agent: AGENT_SLAOUI, contrat: '2026-04-05', expiration: null, created: '2026-04-05 12:10:00', notes: 'Séjour 9 nuits confirmé — acompte versé, solde à l\'arrivée.' },
  { ref: 'REG-2026-011', client: 3,  tRef: 'MVT-2026-004',  clientName: 'Salma & Mehdi Benjelloun', clientType: 'Acheteur',  propId: null, propTitle: '',                           propRef: '', type: 'recherche_achat',  etape: 'reservation', role: 'Acquéreur', montant: '6500000', agent: AGENT_SLAOUI, contrat: '2026-04-12', expiration: null, created: '2026-04-12 11:47:00', notes: 'Compromis signé le 12/04 — financement en cours.' },
  { ref: 'REG-2026-012', client: 19, tRef: null,            clientName: 'James Whitfield',          clientType: 'Voyageur',  propId: null, propTitle: 'Séjours villa Marrakech',    propRef: 'VAC-2026-004', type: 'location_saisonniere', etape: 'annule',  role: 'Voyageur',   montant: '1400',    agent: AGENT_SLAOUI, contrat: '2026-04-28', expiration: null, created: '2026-04-28 18:55:00', notes: 'Réservation annulée — no-show, acompte conservé selon politique.' },
  { ref: 'REG-2026-013', client: 4,  tRef: 'MVT-2026-005',  clientName: 'Omar Chraibi',             clientType: 'Acheteur',  propId: null, propTitle: '',                           propRef: '', type: 'recherche_achat',  etape: 'reservation', role: 'Acquéreur', montant: '8200000', agent: AGENT_SLAOUI, contrat: '2026-05-06', expiration: null, created: '2026-05-06 16:22:00', notes: 'Offre déposée sur Villa Marrakesh — inscriptions des garanties à suivre.' },
  { ref: 'REG-2026-014', client: 17, tRef: null,            clientName: 'Famille Schmidt',          clientType: 'Voyageur',  propId: null, propTitle: 'Séjours villa Marrakech',    propRef: 'VAC-2026-004', type: 'location_saisonniere', etape: 'cloture', role: 'Voyageur',   montant: '1980',    agent: AGENT_SLAOUI, contrat: '2026-05-11', expiration: null, created: '2026-05-11 09:00:00', notes: 'Séjour avril 2026 terminé — avis 5 étoiles, départ ponctuel.' },
  { ref: 'REG-2026-015', client: 15, tRef: 'MVT-2026-011',  clientName: 'Yassine Ouazzani',         clientType: 'Locataire', propId: null, propTitle: '',                           propRef: '', type: 'recherche_location', etape: 'expire',   role: 'Locataire',  montant: '14000',   agent: AGENT_RIDA,   contrat: '2026-01-05', expiration: '2026-07-05', created: '2026-01-05 08:52:00', notes: 'Recherche studio Beauséjour — mandat arrivé à échéance.' },
];

const txIdByRef = new Map();

async function main() {
  const txCount = (await pool.query('SELECT COUNT(*)::int AS c FROM transactions')).rows[0].c;
  const regCount = (await pool.query('SELECT COUNT(*)::int AS c FROM registre')).rows[0].c;
  if (txCount > 0 || regCount > 0) {
    console.log(` CHK transactions=${txCount} registre=${regCount} — already populated, nothing to do.`);
    return;
  }

  for (const t of TRANSACTIONS) {
    const { rows } = await pool.query(
      `INSERT INTO transactions
        (reference, client_id, client_name, client_type, property_id, property_title, property_ref,
         type, etape, role, montant, agent_name, agent_id, date_contracted, date_expiration, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)
       RETURNING id`,
      [t.ref, t.clientId, t.clientName, t.clientType, t.propId, t.propTitle, t.propRef,
       t.type, t.etape, t.role, t.montant, t.agent.name, t.agent.id,
       t.contracted, t.expiration, t.notes, t.created]
    );
    txIdByRef.set(t.ref, rows[0].id);
  }
  console.log(` OK transactions: ${TRANSACTIONS.length} rows inserted`);

  for (const r of REGISTRE) {
    await pool.query(
      `INSERT INTO registre
        (reference, transaction_id, client_id, client_name, client_type, property_id, property_title, property_ref,
         type, etape, role, montant, agent_name, agent_id, date_contrat, date_expiration, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18)`,
      [r.ref, r.tRef ? txIdByRef.get(r.tRef) ?? null : null, r.client, r.clientName, r.clientType,
       r.propId, r.propTitle, r.propRef, r.type, r.etape, r.role, r.montant,
       r.agent.name, r.agent.id, r.contrat, r.expiration, r.notes, r.created]
    );
  }
  console.log(` OK registre: ${REGISTRE.length} rows inserted`);
}

main()
  .then(() => pool.end())
  .catch(err => { console.error(' ERR', err.message); return pool.end().then(() => process.exit(1)); });
