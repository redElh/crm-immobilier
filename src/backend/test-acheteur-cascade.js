/**
 * Test script: Simulates the full Acheteur client lifecycle through all cascade rules.
 *
 * Usage: node test-acheteur-cascade.js
 * Requires: backend running on port 5000, valid JWT token in .env or below.
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.BACKEND_URL || 'http://localhost:5000';
const TOKEN = process.argv[2] || '';

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (TOKEN) opts.headers['Authorization'] = `Bearer ${TOKEN}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`  ✗ ${method} ${path} → ${res.status}`, JSON.stringify(json));
    return null;
  }
  return json;
}

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label} — ${detail || 'FAILED'}`);
    process.exitCode = 1;
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TEST_NAME = `Test Acheteur ${Date.now()}`;

// ─── RULE 1: Non défini → no transaction ─────────────────────────────
async function testRule1(clientId) {
  console.log('\n── Rule 1: Mandat "Non défini" → no transaction ──');

  const txns = await api('GET', `/api/transactions?client_id=${clientId}`);
  assert('No transactions exist', txns && txns.length === 0, `found ${txns?.length}`);

  const regs = await api('GET', `/api/registre?client_id=${clientId}`);
  assert('No registre entries exist', regs && regs.length === 0, `found ${regs?.length}`);

  const ctrs = await api('GET', `/api/contracts/client/${clientId}`);
  assert('No contracts exist', ctrs && ctrs.length === 0, `found ${ctrs?.length}`);
}

// ─── RULE 2: En attente de signature → tx etape "en_attente" ────────
async function testRule2(clientId) {
  console.log('\n── Rule 2: Mandat "En attente de signature" → tx "en_attente", no registre ──');

  const updated = await api('PUT', `/api/clients/${clientId}`, {
    statutMandat: 'En attente de signature',
    statutMetier: 'En qualification',
  });
  assert('Client updated', !!updated);
  await sleep(300);

  const txns = await api('GET', `/api/transactions?client_id=${clientId}`);
  assert('Transaction exists', txns && txns.length > 0);
  if (txns?.length > 0) {
    assert('Transaction etape = "en_attente"', txns[0].etape === 'en_attente', `got "${txns[0].etape}"`);
    assert('Transaction type = "recherche_achat"', txns[0].type === 'recherche_achat', `got "${txns[0].type}"`);
  }

  const regs = await api('GET', `/api/registre?client_id=${clientId}`);
  assert('No registre entries', regs && regs.length === 0, `found ${regs?.length}`);
}

// ─── RULE 3: Actif + En recherche → tx "actif", registre "actif" ────
async function testRule3(clientId) {
  console.log('\n── Rule 3: Mandat "Actif" + "En recherche" → tx "actif", registre "actif" ──');

  const updated = await api('PUT', `/api/clients/${clientId}`, {
    statutMandat: 'Actif',
    statutMetier: 'En recherche',
  });
  assert('Client updated', !!updated);
  await sleep(300);

  const txns = await api('GET', `/api/transactions?client_id=${clientId}`);
  assert('Transaction exists', txns && txns.length > 0);
  if (txns?.length > 0) {
    assert('Transaction etape = "actif"', txns[0].etape === 'actif', `got "${txns[0].etape}"`);
  }

  const regs = await api('GET', `/api/registre?client_id=${clientId}`);
  assert('Registre entry exists', regs && regs.length > 0);
  if (regs?.length > 0) {
    assert('Registre etape = "actif"', regs[0].etape === 'actif', `got "${regs[0].etape}"`);
    assert('Registre type = "recherche_achat"', regs[0].type === 'recherche_achat', `got "${regs[0].type}"`);
  }

  const ctrs = await api('GET', `/api/contracts/client/${clientId}`);
  assert('No contracts yet', ctrs && ctrs.length === 0, `found ${ctrs?.length}`);
}

// ─── RULE 4: Actif + En négociation → tx "actif", registre "actif" ──
async function testRule4(clientId) {
  console.log('\n── Rule 4: Mandat "Actif" + "En négociation" → tx "actif", registre "actif" ──');

  const updated = await api('PUT', `/api/clients/${clientId}`, {
    statutMandat: 'Actif',
    statutMetier: 'En negociation',
  });
  assert('Client updated', !!updated);
  await sleep(300);

  const txns = await api('GET', `/api/transactions?client_id=${clientId}`);
  assert('Transaction exists', txns && txns.length > 0);
  if (txns?.length > 0) {
    assert('Transaction etape = "actif"', txns[0].etape === 'actif', `got "${txns[0].etape}"`);
  }

  const regs = await api('GET', `/api/registre?client_id=${clientId}`);
  assert('Registre entry exists', regs && regs.length > 0);
  if (regs?.length > 0) {
    assert('Registre etape = "actif"', regs[0].etape === 'actif', `got "${regs[0].etape}"`);
  }
}

// ─── RULE 5: Actif + En compromis → tx "actif", registre "reservation", contrat "en_cours" ──
async function testRule5(clientId) {
  console.log('\n── Rule 5: Mandat "Actif" + "En compromis" → tx "actif", registre "reservation", contrat "en_cours" ──');

  const updated = await api('PUT', `/api/clients/${clientId}`, {
    statutMandat: 'Actif',
    statutMetier: 'En compromis',
  });
  assert('Client updated', !!updated);
  await sleep(300);

  const txns = await api('GET', `/api/transactions?client_id=${clientId}`);
  assert('Transaction exists', txns && txns.length > 0);
  if (txns?.length > 0) {
    assert('Transaction etape = "actif"', txns[0].etape === 'actif', `got "${txns[0].etape}"`);
  }

  const regs = await api('GET', `/api/registre?client_id=${clientId}`);
  assert('Registre entry exists', regs && regs.length > 0);
  if (regs?.length > 0) {
    assert('Registre etape = "reservation"', regs[0].etape === 'reservation', `got "${regs[0].etape}"`);
    assert('Registre type = "recherche_achat"', regs[0].type === 'recherche_achat', `got "${regs[0].type}"`);
  }

  const ctrs = await api('GET', `/api/contracts/client/${clientId}`);
  assert('Contract exists', ctrs && ctrs.length > 0);
  if (ctrs?.length > 0) {
    assert('Contract type = "vente"', ctrs[0].contractType === 'vente', `got "${ctrs[0].contractType}"`);
    assert('Contract status = "en_cours"', ctrs[0].status === 'en_cours', `got "${ctrs[0].status}"`);
  }
}

// ─── RULE 6: Termine + Vendu / Acheté → tx "cloture", registre "cloture", contrat "finalise_termine" ──
async function testRule6(clientId) {
  console.log('\n── Rule 6: Mandat "Termine" + "Vendu / Acheté" → tx "cloture", registre "cloture", contrat "finalise_termine" ──');

  const updated = await api('PUT', `/api/clients/${clientId}`, {
    statutMandat: 'Termine',
    statutMetier: 'Vendu / Achete',
  });
  assert('Client updated', !!updated);
  await sleep(300);

  const txns = await api('GET', `/api/transactions?client_id=${clientId}`);
  assert('Transaction exists', txns && txns.length > 0);
  if (txns?.length > 0) {
    assert('Transaction etape = "cloture"', txns[0].etape === 'cloture', `got "${txns[0].etape}"`);
  }

  const regs = await api('GET', `/api/registre?client_id=${clientId}`);
  assert('Registre entry exists', regs && regs.length > 0);
  if (regs?.length > 0) {
    assert('Registre etape = "cloture"', regs[0].etape === 'cloture', `got "${regs[0].etape}"`);
  }

  const ctrs = await api('GET', `/api/contracts/client/${clientId}`);
  assert('Contract exists', ctrs && ctrs.length > 0);
  if (ctrs?.length > 0) {
    assert('Contract type = "vente"', ctrs[0].contractType === 'vente', `got "${ctrs[0].contractType}"`);
    assert('Contract status = "finalise_termine"', ctrs[0].status === 'finalise_termine', `got "${ctrs[0].status}"`);
  }
}

// ─── RULE 7: Expire + Inactif → tx "expire", registre "expire" ──────
async function testRule7(clientId) {
  console.log('\n── Rule 7: Mandat "Expire" + "Inactif" → tx "expire", registre "expire" ──');

  const updated = await api('PUT', `/api/clients/${clientId}`, {
    statutMandat: 'Expire',
    statutMetier: 'Inactif',
  });
  assert('Client updated', !!updated);
  await sleep(300);

  const txns = await api('GET', `/api/transactions?client_id=${clientId}`);
  assert('Transaction exists', txns && txns.length > 0);
  if (txns?.length > 0) {
    assert('Transaction etape = "expire"', txns[0].etape === 'expire', `got "${txns[0].etape}"`);
  }

  const regs = await api('GET', `/api/registre?client_id=${clientId}`);
  assert('Registre entry exists', regs && regs.length > 0);
  if (regs?.length > 0) {
    assert('Registre etape = "expire"', regs[0].etape === 'expire', `got "${regs[0].etape}"`);
  }
}

// ─── RULE 8: Resilie + Perdu → tx "resilie", registre "resilie" ────
async function testRule8(clientId) {
  console.log('\n── Rule 8: Mandat "Resilie" + "Perdu" → tx "resilie", registre "resilie" ──');

  const updated = await api('PUT', `/api/clients/${clientId}`, {
    statutMandat: 'Resilie',
    statutMetier: 'Perdu',
  });
  assert('Client updated', !!updated);
  await sleep(300);

  const txns = await api('GET', `/api/transactions?client_id=${clientId}`);
  assert('Transaction exists', txns && txns.length > 0);
  if (txns?.length > 0) {
    assert('Transaction etape = "resilie"', txns[0].etape === 'resilie', `got "${txns[0].etape}"`);
  }

  const regs = await api('GET', `/api/registre?client_id=${clientId}`);
  assert('Registre entry exists', regs && regs.length > 0);
  if (regs?.length > 0) {
    assert('Registre etape = "resilie"', regs[0].etape === 'resilie', `got "${regs[0].etape}"`);
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────
async function main() {
  console.log('=== Acheteur Cascade Test ===\n');

  // Step 1: Create Acheteur client with Non défini mandat
  console.log('Creating Acheteur client...');
  const client = await api('POST', '/api/clients', {
    clientType: 'Acheteur',
    firstName: 'Test',
    lastName: 'Acheteur Cascade',
    email: `test.cascade.${Date.now()}@example.com`,
    phone: '+212600000000',
    statutMandat: 'Non défini',
    statutMetier: 'En qualification',
  });

  if (!client) {
    console.error('Failed to create client. Is the backend running? Do you need a JWT token?');
    console.error('Usage: node test-acheteur-cascade.js <JWT_TOKEN>');
    process.exit(1);
  }

  console.log(`Created client: ${client.id} (${client.name})`);
  console.log(`  statutMandat: ${client.statutMandat}`);
  console.log(`  statutMetier: ${client.statutMetier}`);

  // Run all rules
  await testRule1(client.id);
  await testRule2(client.id);
  await testRule3(client.id);
  await testRule4(client.id);
  await testRule5(client.id);
  await testRule6(client.id);
  await testRule7(client.id);
  await testRule8(client.id);

  console.log('\n=== Test Complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
