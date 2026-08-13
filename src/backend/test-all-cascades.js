import dotenv from 'dotenv';
dotenv.config();

const API = process.env.API_URL || 'http://localhost:5000/api';
const token = process.argv[2];
if (!token) {
  console.error('Usage: node test-all-cascades.js <JWT_TOKEN>');
  process.exit(1);
}

const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
let passed = 0;
let failed = 0;
let testClientId = 0;

async function api(method, path, body) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg} — FAILED`); }
}

async function createClient(data) {
  const result = await api('POST', '/clients', data);
  const id = result.id || result.client?.id;
  if (!id) throw new Error('No client ID returned');
  return id;
}

async function updateClient(id, data) {
  await api('PUT', `/clients/${id}`, data);
}

async function getTransactions(clientId) {
  const result = await api('GET', `/transactions?client_id=${clientId}`);
  return Array.isArray(result) ? result : (result.transactions || result.data || []);
}

async function getRegistre(clientId) {
  const result = await api('GET', `/registre?client_id=${clientId}`);
  return Array.isArray(result) ? result : (result.registre || result.data || []);
}

async function getContracts(clientId) {
  const result = await api('GET', `/contracts/client/${clientId}`);
  return Array.isArray(result) ? result : (result.contracts || result.data || []);
}

async function cleanup() {
  if (testClientId) {
    try { await api('DELETE', `/clients/${testClientId}`); } catch {}
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VENDEUR TEST
// ═══════════════════════════════════════════════════════════════════════════
async function testVendeur() {
  console.log('\n══ VENDEUR ══');
  testClientId = await createClient({
    firstName: 'Test', lastName: 'Vendeur', email: `test-vendeur-${Date.now()}@test.com`,
    phone: '+212600000001', type: 'Vendeur', statutMandat: 'Non défini', statutMetier: 'En attente de signature',
  });
  console.log(`  Created client: ${testClientId}`);

  // Rule 1: Non défini → no tx
  let tx = await getTransactions(testClientId);
  let reg = await getRegistre(testClientId);
  let ctr = await getContracts(testClientId);
  assert(tx.length === 0, 'Non défini → no tx');
  assert(reg.length === 0, 'Non défini → no registre');
  assert(ctr.length === 0, 'Non défini → no contrat');

  // Rule 2: En attente de signature → tx en_attente
  await updateClient(testClientId, { statutMandat: 'En attente de signature', statutMetier: 'En attente de signature' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx.length > 0, 'En attente de signature → tx created');
  assert(tx[0]?.etape === 'en_attente', `tx etape = "${tx[0]?.etape}" = "en_attente"`);
  assert(tx[0]?.type === 'exclusif', `tx type = "${tx[0]?.type}" = "exclusif"`);
  assert(reg.length === 0, 'En attente de signature → no registre');

  // Rule 3: Actif → tx actif, registre actif
  await updateClient(testClientId, { statutMandat: 'Actif', statutMetier: 'En mandat' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx[0]?.etape === 'actif', `Actif → tx etape = "${tx[0]?.etape}"`);
  assert(reg.length > 0, 'Actif → registre created');
  assert(reg[0]?.etape === 'actif', `Actif → registre etape = "${reg[0]?.etape}"`);
  ctr = await getContracts(testClientId);
  assert(ctr.length === 0, 'Actif → no contrat');

  // Rule 4: Termine → cloture, contrat finalise_termine
  await updateClient(testClientId, { statutMandat: 'Termine', statutMetier: 'Vendu' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  ctr = await getContracts(testClientId);
  assert(tx[0]?.etape === 'cloture', `Termine → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'cloture', `Termine → registre etape = "${reg[0]?.etape}"`);
  assert(ctr.length > 0, 'Termine → contrat created');
  assert(ctr[0]?.contractType === 'vente', `contrat type = "${ctr[0]?.contractType}"`);
  assert(ctr[0]?.status === 'finalise_termine', `contrat status = "${ctr[0]?.status}"`);

  await cleanup();
}

// ═══════════════════════════════════════════════════════════════════════════
// BAILLEUR TEST
// ═══════════════════════════════════════════════════════════════════════════
async function testBailleur() {
  console.log('\n══ BAILLEUR ══');
  testClientId = await createClient({
    firstName: 'Test', lastName: 'Bailleur', email: `test-bailleur-${Date.now()}@test.com`,
    phone: '+212600000002', type: 'Bailleur', statutMandat: 'Non défini', statutMetier: 'En attente de signature',
  });
  console.log(`  Created client: ${testClientId}`);

  let tx, reg, ctr;

  // Rule 1: Non défini → nothing
  tx = await getTransactions(testClientId);
  assert(tx.length === 0, 'Non défini → no tx');

  // Rule 2: En attente de signature → tx en_attente
  await updateClient(testClientId, { statutMandat: 'En attente de signature', statutMetier: 'En attente de signature' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx.length > 0, 'En attente de signature → tx created');
  assert(tx[0]?.etape === 'en_attente', `tx etape = "${tx[0]?.etape}"`);
  assert(tx[0]?.type === 'location_gestion', `tx type = "${tx[0]?.type}"`);
  assert(reg.length === 0, 'En attente de signature → no registre');

  // Rule 3: Actif → tx actif, registre actif
  await updateClient(testClientId, { statutMandat: 'Actif', statutMetier: 'En mandat' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  ctr = await getContracts(testClientId);
  assert(tx[0]?.etape === 'actif', `Actif → tx etape = "${tx[0]?.etape}"`);
  assert(reg.length > 0, 'Actif → registre created');
  assert(reg[0]?.etape === 'actif', `Actif → registre etape = "${reg[0]?.etape}"`);
  assert(ctr.length === 0, 'Actif → no contrat');

  // Rule 4: Termine → cloture, contrat location_classique/finalise_termine
  await updateClient(testClientId, { statutMandat: 'Termine', statutMetier: 'Loue' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  ctr = await getContracts(testClientId);
  assert(tx[0]?.etape === 'cloture', `Termine → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'cloture', `Termine → registre etape = "${reg[0]?.etape}"`);
  assert(ctr.length > 0, 'Termine → contrat created');
  assert(ctr[0]?.contractType === 'location_classique', `contrat type = "${ctr[0]?.contractType}"`);
  assert(ctr[0]?.status === 'finalise_termine', `contrat status = "${ctr[0]?.status}"`);

  // Rule 5: Expire → expire
  await updateClient(testClientId, { statutMandat: 'Expire', statutMetier: 'Inactif' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx[0]?.etape === 'expire', `Expire → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'expire', `Expire → registre etape = "${reg[0]?.etape}"`);

  // Rule 6: Resilie → resilie
  await updateClient(testClientId, { statutMandat: 'Resilie', statutMetier: 'Perdu' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx[0]?.etape === 'resilie', `Resilie → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'resilie', `Resilie → registre etape = "${reg[0]?.etape}"`);

  await cleanup();
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATAIRE TEST
// ═══════════════════════════════════════════════════════════════════════════
async function testLocataire() {
  console.log('\n══ LOCATAIRE ══');
  testClientId = await createClient({
    firstName: 'Test', lastName: 'Locataire', email: `test-locataire-${Date.now()}@test.com`,
    phone: '+212600000003', type: 'Locataire', statutMandat: 'Non défini', statutMetier: 'En recherche',
  });
  console.log(`  Created client: ${testClientId}`);

  let tx, reg, ctr;

  // Rule 1: Non défini → nothing
  tx = await getTransactions(testClientId);
  assert(tx.length === 0, 'Non défini → no tx');

  // Rule 2: Actif → tx actif, registre actif
  await updateClient(testClientId, { statutMandat: 'Actif', statutMetier: 'En visite' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  ctr = await getContracts(testClientId);
  assert(tx.length > 0, 'Actif → tx created');
  assert(tx[0]?.etape === 'actif', `Actif → tx etape = "${tx[0]?.etape}"`);
  assert(tx[0]?.type === 'recherche_location', `tx type = "${tx[0]?.type}"`);
  assert(reg.length > 0, 'Actif → registre created');
  assert(reg[0]?.etape === 'actif', `Actif → registre etape = "${reg[0]?.etape}"`);
  assert(ctr.length === 0, 'Actif → no contrat');

  // Rule 3: Termine → cloture, contrat location_classique/finalise_termine
  await updateClient(testClientId, { statutMandat: 'Termine', statutMetier: 'Installe' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  ctr = await getContracts(testClientId);
  assert(tx[0]?.etape === 'cloture', `Termine → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'cloture', `Termine → registre etape = "${reg[0]?.etape}"`);
  assert(ctr.length > 0, 'Termine → contrat created');
  assert(ctr[0]?.contractType === 'location_classique', `contrat type = "${ctr[0]?.contractType}"`);
  assert(ctr[0]?.status === 'finalise_termine', `contrat status = "${ctr[0]?.status}"`);

  // Rule 4: Expire → expire
  testClientId = await createClient({
    firstName: 'Test', lastName: 'Locataire2', email: `test-locataire2-${Date.now()}@test.com`,
    phone: '+212600000033', type: 'Locataire', statutMandat: 'Actif', statutMetier: 'En visite',
  });
  await updateClient(testClientId, { statutMandat: 'Expire', statutMetier: 'Inactif' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx[0]?.etape === 'expire', `Expire → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'expire', `Expire → registre etape = "${reg[0]?.etape}"`);

  // Rule 5: Resilie → resilie
  testClientId = await createClient({
    firstName: 'Test', lastName: 'Locataire3', email: `test-locataire3-${Date.now()}@test.com`,
    phone: '+212600000034', type: 'Locataire', statutMandat: 'Actif', statutMetier: 'En visite',
  });
  await updateClient(testClientId, { statutMandat: 'Resilie', statutMetier: 'Perdu' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx[0]?.etape === 'resilie', `Resilie → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'resilie', `Resilie → registre etape = "${reg[0]?.etape}"`);

  await cleanup();
}

// ═══════════════════════════════════════════════════════════════════════════
// VOYAGEUR TEST
// ═══════════════════════════════════════════════════════════════════════════
async function testVoyageur() {
  console.log('\n══ VOYAGEUR ══');
  testClientId = await createClient({
    firstName: 'Test', lastName: 'Voyageur', email: `test-voyageur-${Date.now()}@test.com`,
    phone: '+212600000004', type: 'Voyageur', statutMandat: 'Non défini', statutMetier: 'En recherche',
  });
  console.log(`  Created client: ${testClientId}`);

  let tx, reg, ctr;

  // Rule 1: Brouillon/Non défini → nothing
  tx = await getTransactions(testClientId);
  assert(tx.length === 0, 'Brouillon → no tx');

  // Rule 2: En attente → tx actif (reservation started)
  await updateClient(testClientId, { statutMandat: 'En attente', statutMetier: 'Reservation en cours' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx.length > 0, 'En attente → tx created');
  assert(tx[0]?.etape === 'actif', `En attente → tx etape = "${tx[0]?.etape}"`);
  assert(tx[0]?.type === 'location_saisonniere', `tx type = "${tx[0]?.type}"`);
  assert(reg.length > 0, 'En attente → registre created');
  assert(reg[0]?.etape === 'reservation', `En attente → registre etape = "${reg[0]?.etape}"`);

  // Rule 3: Actif (Confirmed) → tx actif, registre actif
  await updateClient(testClientId, { statutMandat: 'Actif', statutMetier: 'Confirme' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx[0]?.etape === 'actif', `Actif → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'actif', `Actif → registre etape = "${reg[0]?.etape}"`);

  // Rule 4: Terminé → cloture, registre cloture
  await updateClient(testClientId, { statutMandat: 'Terminé', statutMetier: 'Termine' });
  tx = await getTransactions(testClientId);
  reg = await getRegistre(testClientId);
  assert(tx[0]?.etape === 'cloture', `Terminé → tx etape = "${tx[0]?.etape}"`);
  assert(reg[0]?.etape === 'cloture', `Terminé → registre etape = "${reg[0]?.etape}"`);

  await cleanup();
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
try {
  console.log('=== All Cascade Tests ===');
  await testVendeur();
  await testBailleur();
  await testLocataire();
  await testVoyageur();
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
} catch (e) {
  console.error('\nFATAL:', e.message);
  await cleanup();
  process.exit(1);
}
