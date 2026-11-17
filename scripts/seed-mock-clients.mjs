/**
 * Seed mock clients into the running backend via the REST API.
 *
 * Mirrors src/data/mockClients.ts (which is TypeScript and can't be imported
 * directly from plain Node without a TS loader), so this script embeds a
 * compact, self-contained subset covering all 5 client types.
 *
 * Usage:
 *   API_URL=http://localhost:5000 AGENT_EMAIL=agent@example.com AGENT_PASSWORD=secret node scripts/seed-mock-clients.mjs
 *   # or with a ready-made JWT:
 *   API_URL=http://localhost:5000 TOKEN=<jwt> node scripts/seed-mock-clients.mjs
 *
 * The script logs in (if TOKEN is not provided), then POSTs each record to
 * POST /api/clients and prints a summary. It is idempotent-ish: it skips
 * records whose email already exists (checked via GET /api/clients?search=).
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TOKEN = process.env.TOKEN || '';
const AGENT_EMAIL = process.env.AGENT_EMAIL || '';
const AGENT_PASSWORD = process.env.AGENT_PASSWORD || '';

const MOCK_SEED_CLIENTS = [
  // ── Acheteurs ──
  { clientType: 'Acheteur', firstName: 'Yasmine', lastName: 'El Amrani', email: 'yasmine.elamrani@example.com', phone: '+212 6 61 23 45 67', status: 'Actif', statutMetier: 'En recherche', notes: 'Résidence principale Casablanca Maârif, financement pré-approuvé.', propertyType: 'Appartement', area: 'Casablanca', secteur: 'Maârif', minSurface: 90, surfaceMax: 130, pieces: 4, chambres: 3, prixMin: 1400000, prixMax: 1900000, devise: 'MAD', contribution: 500000, financingType: 'Prêt bancaire', loanDuration: 20, currentSituation: 'Locataire', urgency: '3 mois', classification: 'Très actif', croisementAutomatique: true, criteres: ['Balcon', 'Parking', 'Ascenseur'] },
  { clientType: 'Acheteur', firstName: 'Julien', lastName: 'Moreau', email: 'julien.moreau@example.com', phone: '+33 6 12 88 44 22', status: 'Actif', statutMetier: 'En negociation', notes: 'Expatrié, pied-à-terre Marrakech Guéliz. Offre en cours.', propertyType: 'Appartement', area: 'Marrakech', secteur: 'Guéliz', minSurface: 70, surfaceMax: 100, pieces: 3, chambres: 2, prixMin: 1100000, prixMax: 1500000, devise: 'MAD', financingType: 'Comptant', currentSituation: 'Propriétaire', urgency: '1 mois', croisementAutomatique: true },
  { clientType: 'Acheteur', firstName: 'Salma & Mehdi', lastName: 'Benjelloun', email: 'benjelloun.famille@example.com', phone: '+212 6 62 11 99 00', status: 'Actif', statutMetier: 'En recherche', notes: 'Jeune couple, villa avec jardin Rabat Souissi.', propertyType: 'Villa', area: 'Rabat', secteur: 'Souissi', minSurface: 180, surfaceMax: 260, pieces: 6, chambres: 4, prixMin: 3500000, prixMax: 4500000, devise: 'MAD', contribution: 900000, financingType: 'Prêt bancaire', loanDuration: 25, croisementAutomatique: true },
  // ── Vendeurs ──
  { clientType: 'Vendeur', firstName: 'Rachid', lastName: 'El Fassi', email: 'rachid.elfassi@example.com', phone: '+212 6 63 45 67 89', status: 'Actif', statutMetier: 'En mandat', notes: 'Villa Palmeraie, mutation vers Casablanca.', propertyType: 'Villa', area: 'Marrakech', secteur: 'Palmeraie', minSurface: 300, prixMin: 4800000, prixMax: 5200000, prixNetVendeur: 4800000, prixVenteFAI: 5200000, devise: 'MAD', statutMandat: 'Actif', typeMandat: 'Exclusif', numeroMandat: 'MV-2026-101', dateSignature: '2026-05-15', dateDebut: '2026-05-15', dateExpiration: '2026-11-15', reasonForSelling: 'Mutation professionnelle', adresseComplete: '12 Rue des Palmiers, Palmeraie, Marrakech' },
  { clientType: 'Vendeur', firstName: 'Claire', lastName: 'Fontaine', email: 'claire.fontaine@example.com', phone: '+33 6 77 21 34 56', status: 'Actif', statutMetier: 'En attente de signature', notes: 'Appartement Essaouira Médina, retour en France.', propertyType: 'Appartement', area: 'Essaouira', secteur: 'Médina', minSurface: 65, prixMin: 950000, prixMax: 1050000, devise: 'MAD', statutMandat: 'En attente de signature', typeMandat: 'Simple', reasonForSelling: 'Retour définitif en France' },
  // ── Bailleurs ──
  { clientType: 'Bailleur', firstName: 'Moulay Driss', lastName: 'Alaoui', email: 'moulaydriss.alaoui@example.com', phone: '+212 6 66 34 12 78', status: 'Actif', statutMetier: 'En mandat', notes: 'Appartement Anfa en gestion locative.', propertyType: 'Appartement', area: 'Casablanca', secteur: 'Anfa', minSurface: 110, devise: 'MAD', statutMandat: 'Actif', typeMandat: 'Gestion', numeroMandat: 'MG-2026-031', dateSignature: '2026-03-01', dateDebut: '2026-03-01', dateExpiration: '2027-03-01', loyerHC: 12000, charges: 1500, depotGarantie: 24000, typeLoyer: 'Vide', periodiciteLoyer: 'Mensuelle', raisonMiseEnLocation: 'Investissement locatif', dateDisponibilite: '2026-07-01', preferredTenant: 'Cadre / couple sans enfants' },
  { clientType: 'Bailleur', firstName: 'Loubna', lastName: 'Hakam', email: 'loubna.hakam@example.com', phone: '+212 6 67 90 12 34', status: 'Actif', statutMetier: 'En attente de signature', notes: 'Studio étudiant Rabat Agdal.', propertyType: 'Studio', area: 'Rabat', secteur: 'Agdal', minSurface: 35, devise: 'MAD', loyerHC: 4500, charges: 500, depotGarantie: 9000, typeLoyer: 'Meublé', periodiciteLoyer: 'Mensuelle', raisonMiseEnLocation: 'Studio étudiant', dateDisponibilite: '2026-09-01' },
  // ── Locataires ──
  { clientType: 'Locataire', firstName: 'Anas', lastName: 'Berrada', email: 'anas.berrada@example.com', phone: '+212 6 69 45 67 12', status: 'Actif', statutMetier: 'En recherche', notes: 'CDI OCP, cherche 3 pièces Bourgogne.', propertyType: 'Appartement', area: 'Casablanca', secteur: 'Bourgogne', minSurface: 60, surfaceMax: 85, pieces: 3, chambres: 2, prixMin: 6000, prixMax: 8000, devise: 'MAD', employmentStatus: 'CDI', nomEmployeur: 'OCP Group', anciennete: 3, revenusMensuelsNets: 18000, furnished: false, minRentalDuration: 12, moveInDate: '2026-08-01', croisementAutomatique: true },
  { clientType: 'Locataire', firstName: 'Élise', lastName: 'Dubois', email: 'elise.dubois@example.com', phone: '+33 6 98 12 34 78', status: 'Actif', statutMetier: 'En visite', notes: 'CDD ONG, studio meublé Hivernage, garante disponible.', propertyType: 'Studio', area: 'Marrakech', secteur: 'Hivernage', minSurface: 30, surfaceMax: 45, prixMin: 4000, prixMax: 5500, devise: 'MAD', employmentStatus: 'CDD', revenusMensuelsNets: 12000, guarantor: true, guarantorName: 'Philippe Dubois (père)', furnished: true, moveInDate: '2026-07-15' },
  // ── Voyageurs ──
  { clientType: 'Voyageur', firstName: 'Famille', lastName: 'Schmidt', email: 'familie.schmidt@example.com', phone: '+49 170 123 4567', status: 'Actif', statutMetier: 'Confirme', notes: '5 pers., villa piscine Taghazout 02-09/08/2026. Lit bébé requis.', propertyType: 'Villa avec piscine', area: 'Agadir', secteur: 'Taghazout', devise: 'EUR', nbPersonnes: 5, nbAdultes: 2, nbEnfants: 3, budgetParNuitMin: 180, budgetParNuitMax: 280, tarifNuit: 220, budgetTotal: 1540, nbNuits: 7, dateArrivee: '2026-08-02', dateDepart: '2026-08-09', statutReservation: 'Confirmée', numeroReservation: 'RES-2026-101', modePaiement: 'Carte bancaire', acompteVersee: 462, languesParlees: ['Allemand', 'Anglais'] },
  { clientType: 'Voyageur', firstName: 'Charlotte', lastName: 'Lefèvre', email: 'charlotte.lefevre@example.com', phone: '+33 6 55 44 33 22', status: 'Actif', statutMetier: 'Reservation en cours', notes: 'Riad Médina Marrakech 18-22/07/2026, 2 pers.', propertyType: 'Riad', area: 'Marrakech', secteur: 'Médina', devise: 'EUR', nbPersonnes: 2, budgetParNuitMin: 90, budgetParNuitMax: 150, budgetTotal: 480, nbNuits: 4, dateArrivee: '2026-07-18', dateDepart: '2026-07-22', statutReservation: 'En attente', numeroReservation: 'RES-2026-102', modePaiement: 'Virement', languesParlees: ['Français', 'Anglais'] },
  { clientType: 'Voyageur', firstName: 'Aicha', lastName: 'Benomar', email: 'aicha.benomar@example.com', phone: '+212 6 72 33 44 55', status: 'Actif', statutMetier: 'Paye', notes: 'Chalet Ifrane 20-23/06/2026, 6 pers., soldé.', propertyType: 'Chalet', area: 'Ifrane', secteur: 'Centre', devise: 'MAD', nbPersonnes: 6, budgetParNuitMin: 800, budgetParNuitMax: 1200, tarifNuit: 1000, budgetTotal: 3000, nbNuits: 3, dateArrivee: '2026-06-20', dateDepart: '2026-06-23', statutReservation: 'Payée', numeroReservation: 'RES-2026-098', modePaiement: 'Espèces' },
];

async function login() {
  if (TOKEN) return TOKEN;
  if (!AGENT_EMAIL || !AGENT_PASSWORD) {
    throw new Error('Provide TOKEN or AGENT_EMAIL + AGENT_PASSWORD env vars.');
  }
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: AGENT_EMAIL, password: AGENT_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.token || data.sessionToken || data.accessToken || '';
}

async function clientExists(authHeaders, email) {
  const res = await fetch(`${API_URL}/api/clients?search=${encodeURIComponent(email)}`, { headers: authHeaders });
  if (!res.ok) return false;
  const list = await res.json();
  return Array.isArray(list) && list.some((c) => (c.email || '').toLowerCase() === email.toLowerCase());
}

async function main() {
  const token = await login();
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const payload of MOCK_SEED_CLIENTS) {
    try {
      if (await clientExists(authHeaders, payload.email)) {
        console.log(`SKIP  ${payload.clientType} ${payload.email} (already exists)`);
        skipped += 1;
        continue;
      }
      const res = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(`FAIL  ${payload.email}: ${res.status} ${await res.text()}`);
        failed += 1;
        continue;
      }
      const createdClient = await res.json();
      console.log(`OK    ${payload.clientType} ${payload.email} -> id ${createdClient.id}`);
      created += 1;
    } catch (err) {
      console.error(`FAIL  ${payload.email}: ${err.message}`);
      failed += 1;
    }
  }
  console.log(`\nDone: ${created} created, ${skipped} skipped, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
