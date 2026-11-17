/**
 * Seed demo contacts so the admin contacts page (and its 3D stat objects)
 * has rich, realistic data to visualize.
 *
 * Usage (from repo root):
 *   node src/backend/seed-mock-contacts.mjs
 *   node src/backend/seed-mock-contacts.mjs --clean   # remove demo contacts
 *
 * Idempotent: rows whose email already exists are skipped. Every row uses the
 * "@demo-immo.ma" domain so it can be removed safely with --clean.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const { Pool } = require('pg');

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
  host: cfg.DB_HOST || '127.0.0.1',
  port: parseInt(cfg.DB_PORT || '5432', 10),
  database: cfg.DB_NAME,
});

const DEMO_SUFFIX = '@demo-immo.ma';
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const dateAgo = (n) => daysAgo(n).slice(0, 10);

let mandatSeq = 0;
const mandat = (clientType, status, extra = {}) => {
  mandatSeq += 1;
  const start = extra.startDaysAgo ?? 60;
  return {
    id: crypto.randomUUID(),
    clientType,
    status,
    startDate: dateAgo(start),
    ...(status === 'Expiré' ? { endDate: dateAgo(Math.max(1, start - 120)) } : {}),
    propertyType: extra.propertyType || 'Appartement',
    area: extra.area || 'Casablanca',
    notes: extra.notes || '',
    numeroMandat: `M-2026-${String(mandatSeq).padStart(3, '0')}`,
    typeMandat: extra.typeMandat || 'Simple',
    statutMetier: extra.statutMetier || (status === 'Actif' ? 'En mandat' : 'En attente'),
    statutMandat: status,
    ...(status === 'Actif' ? { dateSignature: dateAgo(start) } : {}),
    ...extra.fields,
  };
};

const CONTACTS = [
  {
    type: 'Particulier', civility: 'M.', firstName: 'Ahmed', lastName: 'Benali',
    email: 'ahmed.benali@demo-immo.ma', mobile: '+212 6 12 34 56 78',
    profession: 'Ingénieur génie civil', ville: 'Marrakech', pays: 'Maroc',
    moyen: 'Email', langues: ['Français', 'Arabe', 'Anglais'], devise: 'MAD',
    situation: 'Marié', enfants: 2, agentId: 6, createdDaysAgo: 5,
    commentaire: 'Cherche une résidence principale à Marrakech.',
    mandats: [
      mandat('Acheteur', 'Actif', { startDaysAgo: 45, propertyType: 'Appartement', area: 'Marrakech', notes: '3 pièces avec balcon et parking' }),
      mandat('Vendeur', 'Actif', { startDaysAgo: 30, propertyType: 'Villa', area: 'Marrakech', notes: 'Villa Palmeraie à céder' }),
    ],
  },
  {
    type: 'Particulier', civility: 'Mme', firstName: 'Sophie', lastName: 'Martin',
    email: 'sophie.martin@demo-immo.ma', mobile: '+33 6 98 76 54 32',
    profession: 'Avocate', ville: 'Casablanca', pays: 'Maroc',
    moyen: 'Email', langues: ['Français'], devise: 'EUR',
    situation: 'Célibataire', agentId: 5, createdDaysAgo: 12,
    commentaire: 'Investisseuse, souhaite un bien locatif.',
    mandats: [
      mandat('Vendeur', 'Actif', { startDaysAgo: 150, propertyType: 'Maison', area: 'Casablanca', notes: 'Villa 4 pièces, jardin 200 m²' }),
      mandat('Acheteur', 'Expiré', { startDaysAgo: 210, propertyType: 'Appartement', area: 'Rabat' }),
    ],
  },
  {
    type: 'Professionnel', civility: 'M.', firstName: 'Youssef', lastName: 'Amrani',
    email: 'youssef.amrani@demo-immo.ma', mobile: '+212 6 54 32 10 98',
    profession: 'Promoteur immobilier', ville: 'Rabat', pays: 'Maroc',
    moyen: 'Téléphone', langues: ['Arabe', 'Français'], devise: 'MAD',
    situation: 'Marié', enfants: 3, agentId: 6, createdDaysAgo: 20,
    commentaire: 'Client récurrent, plusieurs opérations en cours.',
    mandats: [
      mandat('Bailleur', 'Actif', { startDaysAgo: 90, propertyType: 'Immeuble', area: 'Rabat', notes: 'Gestion locative immeuble 12 lots', typeMandat: 'Gestion' }),
    ],
  },
  {
    type: 'Indivision / Succession', civility: 'Mlle', firstName: 'Fatima', lastName: 'Zahra',
    email: 'fatima.zahra@demo-immo.ma', mobile: '+212 6 45 67 89 01',
    profession: '', ville: 'Casablanca', pays: 'Maroc',
    moyen: 'WhatsApp', langues: ['Français', 'Anglais', 'Espagnol'], devise: 'MAD',
    situation: 'Divorcé', enfants: 1, agentId: 5, createdDaysAgo: 35,
    commentaire: 'Dossier de succession en cours chez le notaire.',
    mandats: [
      mandat('Locataire', 'Expiré', { startDaysAgo: 240, propertyType: 'Appartement', area: 'Casablanca' }),
      mandat('Voyageur', 'Actif', { startDaysAgo: 15, propertyType: 'Riad', area: 'Marrakech', notes: 'Séjour familial, 4 personnes' }),
    ],
  },
  {
    type: 'Particulier', civility: 'M.', firstName: 'Karim', lastName: 'El Fassi',
    email: 'karim.elfassi@demo-immo.ma', mobile: '+212 6 33 44 55 66',
    profession: 'Médecin', ville: 'Tanger', pays: 'Maroc',
    moyen: 'Email', langues: ['Français', 'Arabe'], devise: 'MAD',
    situation: 'Marié', enfants: 2, agentId: 6, createdDaysAgo: 48,
    commentaire: 'Contact qualifié, pas encore de mandat signé.',
    mandats: [],
  },
  {
    type: 'Particulier', civility: 'Mme', firstName: 'Leila', lastName: 'Benbrahim',
    email: 'leila.benbrahim@demo-immo.ma', mobile: '+212 6 11 22 33 44',
    profession: 'Architecte', ville: 'Marrakech', pays: 'Maroc',
    moyen: 'Téléphone', langues: ['Français', 'Anglais'], devise: 'MAD',
    situation: 'Marié', enfants: 2, agentId: 5, createdDaysAgo: 3,
    commentaire: 'Recherche active, très réactive.',
    mandats: [
      mandat('Acheteur', 'Actif', { startDaysAgo: 10, propertyType: 'Villa', area: 'Marrakech', notes: 'Villa avec jardin, 4 chambres minimum' }),
    ],
  },
  {
    type: 'Professionnel', civility: 'M.', firstName: 'Hassan', lastName: 'Ouazzani',
    email: 'hassan.ouazzani@demo-immo.ma', mobile: '+212 6 77 88 99 00',
    profession: 'Agent immobilier', ville: 'Essaouira', pays: 'Maroc',
    moyen: 'Email', langues: ['Arabe', 'Français'], devise: 'MAD',
    situation: 'Marié', agentId: 6, createdDaysAgo: 60,
    commentaire: 'Partenaire local, à qualifier pour un mandat.',
    mandats: [],
  },
  {
    type: 'Particulier', civility: 'M.', firstName: 'Mehdi', lastName: 'Alaoui',
    email: 'mehdi.alaoui@demo-immo.ma', mobile: '+212 6 22 33 44 55',
    profession: 'Commercial', ville: 'Casablanca', pays: 'Maroc',
    moyen: 'WhatsApp', langues: ['Français'], devise: 'MAD',
    situation: 'Célibataire', agentId: null, createdDaysAgo: 8,
    commentaire: 'Contact entrant via le site web, non assigné.',
    mandats: [],
  },
  {
    type: 'Particulier', civility: 'Mme', firstName: 'Amina', lastName: 'Bennis',
    email: 'amina.bennis@demo-immo.ma', mobile: '+212 6 66 77 88 99',
    profession: 'Avocate d\'affaires', ville: 'Casablanca', pays: 'Maroc',
    moyen: 'Email', langues: ['Français', 'Anglais'], devise: 'MAD',
    situation: 'Célibataire', agentId: 5, createdDaysAgo: 25,
    commentaire: 'Multi-mandats, profil premium.',
    mandats: [
      mandat('Bailleur', 'Actif', { startDaysAgo: 70, propertyType: 'Appartement', area: 'Casablanca', notes: 'Appartement de standing, 3 chambres' }),
      mandat('Locataire', 'Actif', { startDaysAgo: 40, propertyType: 'Bureau', area: 'Casablanca' }),
    ],
  },
  {
    type: 'Indivision / Succession', civility: 'M.', firstName: 'Reda', lastName: 'Chraibi',
    email: 'reda.chraibi@demo-immo.ma', mobile: '+212 6 88 99 00 11',
    profession: '', ville: 'Agadir', pays: 'Maroc',
    moyen: 'Téléphone', langues: ['Français'], devise: 'MAD',
    situation: 'Marié', agentId: null, createdDaysAgo: 110,
    commentaire: 'Succession complexe, plusieurs héritiers.',
    mandats: [
      mandat('Vendeur', 'Expiré', { startDaysAgo: 300, propertyType: 'Maison', area: 'Agadir' }),
    ],
  },
  {
    type: 'Particulier', civility: 'Mme', firstName: 'Samira', lastName: 'El Ouafi',
    email: 'samira.elouafi@demo-immo.ma', mobile: '+212 6 99 00 11 22',
    profession: 'Enseignante', ville: 'Fès', pays: 'Maroc',
    moyen: 'Email', langues: ['Arabe', 'Français'], devise: 'MAD',
    situation: 'Marié', enfants: 3, agentId: 6, createdDaysAgo: 2,
    commentaire: 'Budget maîtrisé, financement en cours.',
    mandats: [
      mandat('Acheteur', 'Actif', { startDaysAgo: 7, propertyType: 'Appartement', area: 'Fès', notes: 'Budget max 800K MAD, 3 chambres' }),
    ],
  },
  {
    type: 'Professionnel', civility: 'M.', firstName: 'Omar', lastName: 'Bennani',
    email: 'omar.bennani@demo-immo.ma', mobile: '+212 6 11 22 33 44',
    profession: 'Promoteur immobilier', ville: 'Casablanca', pays: 'Maroc',
    moyen: 'Email', langues: ['Français', 'Arabe'], devise: 'MAD',
    situation: 'Marié', agentId: 5, createdDaysAgo: 75,
    commentaire: 'Portefeuille d\'immeubles de rapport.',
    mandats: [
      mandat('Vendeur', 'Actif', { startDaysAgo: 130, propertyType: 'Immeuble', area: 'Casablanca', notes: 'Immeuble de rapport, 12 appartements', typeMandat: 'Exclusif' }),
    ],
  },
  {
    type: 'Particulier', civility: 'M.', firstName: 'Khalid', lastName: 'El Amrani',
    email: 'khalid.elamrani@demo-immo.ma', mobile: '+212 6 77 66 55 44',
    profession: 'Chef d\'entreprise', ville: 'Tanger', pays: 'Maroc',
    moyen: 'Téléphone', langues: ['Arabe', 'Français', 'Anglais'], devise: 'MAD',
    situation: 'Marié', agentId: 6, createdDaysAgo: 40,
    commentaire: 'Cherche un local commercial en zone touristique.',
    mandats: [
      mandat('Acheteur', 'Actif', { startDaysAgo: 55, propertyType: 'Commerce', area: 'Tanger', notes: 'Local commercial, zone touristique' }),
    ],
  },
  {
    type: 'Particulier', civility: 'M.', firstName: 'Younes', lastName: 'Atik',
    email: 'younes.atik@demo-immo.ma', mobile: '+212 6 33 22 11 00',
    profession: 'Consultant', ville: 'Casablanca', pays: 'Maroc',
    moyen: 'Email', langues: ['Français', 'Anglais'], devise: 'MAD',
    situation: 'Marié', enfants: 1, agentId: 5, createdDaysAgo: 6,
    commentaire: 'Réservation saisonnière pour l\'été.',
    mandats: [
      mandat('Voyageur', 'Actif', { startDaysAgo: 20, propertyType: 'Villa avec piscine', area: 'Marrakech', notes: 'Vacances en famille, maison avec piscine' }),
    ],
  },
  {
    type: 'Particulier', civility: 'Mme', firstName: 'Nadia', lastName: 'Tazi',
    email: 'nadia.tazi@demo-immo.ma', mobile: '+212 6 55 66 77 88',
    profession: '', ville: 'Rabat', pays: 'Maroc',
    moyen: 'Téléphone', langues: ['Français'], devise: 'MAD',
    situation: 'Veuf', agentId: null, createdDaysAgo: 9,
    commentaire: 'À rappeler pour un premier rendez-vous.',
    mandats: [],
  },
  {
    type: 'Professionnel', civility: 'M.', firstName: 'Hicham', lastName: 'Bennis',
    email: 'hicham.bennis@demo-immo.ma', mobile: '+212 6 44 55 66 77',
    profession: 'Gérant de société', ville: 'Casablanca', pays: 'Maroc',
    moyen: 'Email', langues: ['Français', 'Arabe'], devise: 'MAD',
    situation: 'Marié', agentId: 6, createdDaysAgo: 55,
    commentaire: 'Société propriétaire de plusieurs biens.',
    mandats: [
      mandat('Bailleur', 'En attente', { startDaysAgo: 12, propertyType: 'Appartement', area: 'Casablanca', notes: 'Mandat en attente de signature' }),
      mandat('Locataire', 'Actif', { startDaysAgo: 35, propertyType: 'Bureau', area: 'Casablanca' }),
    ],
  },
  {
    type: 'Particulier', civility: 'M.', firstName: 'Salma', lastName: 'Benjelloun',
    email: 'salma.benjelloun@demo-immo.ma', mobile: '+212 6 62 11 99 00',
    profession: 'Cadre bancaire', ville: 'Rabat', pays: 'Maroc',
    moyen: 'Email', langues: ['Français', 'Arabe'], devise: 'MAD',
    situation: 'Marié', enfants: 2, agentId: 5, createdDaysAgo: 1,
    commentaire: 'Jeune couple, projet de villa familiale.',
    mandats: [
      mandat('Acheteur', 'En attente', { startDaysAgo: 3, propertyType: 'Villa', area: 'Rabat', notes: 'Offre déposée, financement à confirmer' }),
    ],
  },
  {
    type: 'Particulier', civility: 'Mme', firstName: 'Claire', lastName: 'Fontaine',
    email: 'claire.fontaine@demo-immo.ma', mobile: '+33 6 77 21 34 56',
    profession: 'Consultante', ville: 'Essaouira', pays: 'Maroc',
    moyen: 'Email', langues: ['Français', 'Anglais'], devise: 'EUR',
    situation: 'Célibataire', agentId: 6, createdDaysAgo: 15,
    commentaire: 'Retour en France, souhaite louer puis vendre.',
    mandats: [
      mandat('Vendeur', 'Actif', { startDaysAgo: 80, propertyType: 'Appartement', area: 'Essaouira' }),
      mandat('Bailleur', 'Expiré', { startDaysAgo: 200, propertyType: 'Appartement', area: 'Essaouira' }),
      mandat('Locataire', 'Actif', { startDaysAgo: 25, propertyType: 'Maison', area: 'Essaouira' }),
    ],
  },
  {
    type: 'Indivision / Succession', civility: 'M.', firstName: 'Moulay Driss', lastName: 'Alaoui',
    email: 'moulaydriss.alaoui@demo-immo.ma', mobile: '+212 6 66 34 12 78',
    profession: 'Retraité', ville: 'Casablanca', pays: 'Maroc',
    moyen: 'Téléphone', langues: ['Arabe', 'Français'], devise: 'MAD',
    situation: 'Marié', agentId: 5, createdDaysAgo: 70,
    commentaire: 'Indivision familiale, gestion locative en cours.',
    mandats: [
      mandat('Bailleur', 'Actif', { startDaysAgo: 160, propertyType: 'Appartement', area: 'Casablanca', notes: 'Appartement Anfa en gestion locative', typeMandat: 'Gestion' }),
      mandat('Vendeur', 'Actif', { startDaysAgo: 95, propertyType: 'Villa', area: 'Casablanca', notes: 'Villa à vendre, mandat exclusif', typeMandat: 'Exclusif' }),
    ],
  },
  {
    type: 'Particulier', civility: 'Mme', firstName: 'Élise', lastName: 'Dubois',
    email: 'elise.dubois@demo-immo.ma', mobile: '+33 6 98 12 34 78',
    profession: 'Chargée de mission ONG', ville: 'Marrakech', pays: 'Maroc',
    moyen: 'WhatsApp', langues: ['Français', 'Anglais'], devise: 'MAD',
    situation: 'Célibataire', agentId: 6, createdDaysAgo: 4,
    commentaire: 'Recherche un studio meublé, garante disponible.',
    mandats: [
      mandat('Locataire', 'Actif', { startDaysAgo: 9, propertyType: 'Studio', area: 'Marrakech', notes: 'Studio meublé Hivernage, garante disponible' }),
    ],
  },
];

const INSERT = `
  INSERT INTO contacts (
    contact_type, civility, first_name, last_name, email_principal, mobile,
    profession, ville, pays, moyen_contact_prefere, langue_parlee, devise_preferee,
    situation_familiale, nombre_enfants, commentaire_prive, mandats, agent_id,
    created_at, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16::jsonb,$17,$18,$19
  ) RETURNING id
`;

async function clean() {
  const res = await pool.query('DELETE FROM contacts WHERE email_principal LIKE $1', [`%${DEMO_SUFFIX}`]);
  console.log(`Removed ${res.rowCount} demo contact(s).`);
}

async function seed() {
  const existing = await pool.query(
    'SELECT LOWER(email_principal) AS email FROM contacts WHERE email_principal LIKE $1',
    [`%${DEMO_SUFFIX}`],
  );
  const known = new Set(existing.rows.map((r) => r.email));

  let created = 0;
  let skipped = 0;
  for (const c of CONTACTS) {
    const email = c.email.toLowerCase();
    if (known.has(email)) {
      skipped += 1;
      continue;
    }
    await pool.query(INSERT, [
      c.type,
      c.civility,
      c.firstName,
      c.lastName,
      c.email,
      c.mobile,
      c.profession || '',
      c.ville || '',
      c.pays || '',
      c.moyen || '',
      JSON.stringify(c.langues || []),
      c.devise || '',
      c.situation || '',
      c.enfants ?? null,
      c.commentaire || '',
      JSON.stringify(c.mandats || []),
      c.agentId ?? null,
      daysAgo(c.createdDaysAgo ?? 30),
      daysAgo(c.createdDaysAgo ?? 30),
    ]);
    created += 1;
    console.log(`ADD   ${c.type.padEnd(22)} ${c.firstName} ${c.lastName} (${c.mandats?.length || 0} mandat(s))`);
  }
  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
}

try {
  if (process.argv.includes('--clean')) {
    await clean();
  } else {
    await seed();
  }
} finally {
  await pool.end();
}
