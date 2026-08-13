import pool from './config/db.js';
import { onClientStatusChange } from './services/status-transition.service.js';

let passed = 0;
let failed = 0;

async function assert(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${e}`);
    console.error(`    actual:   ${a}`);
  }
}

async function getTx(clientId) {
  const { rows } = await pool.query('SELECT etape, type FROM transactions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1', [clientId]);
  return rows[0] || null;
}

async function getReg(clientId) {
  const { rows } = await pool.query('SELECT etape, type FROM registre WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1', [clientId]);
  return rows[0] || null;
}

async function getCtr(clientId) {
  const { rows } = await pool.query('SELECT status, contract_type FROM contracts WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1', [clientId]);
  return rows[0] || null;
}

async function clean(id) {
  await pool.query('DELETE FROM transactions WHERE client_id = $1', [id]);
  await pool.query('DELETE FROM registre WHERE client_id = $1', [id]);
  await pool.query('DELETE FROM contracts WHERE client_id = $1', [id]);
  await pool.query('DELETE FROM owner_clients WHERE id = $1', [id]);
}

async function createClient(mandatStatus, statutMetier) {
  const { rows } = await pool.query(
    `INSERT INTO owner_clients (client_type, first_name, last_name, email, status, statut_metier, agent_id, agent_designe, mandat_status, data)
     VALUES ('Voyageur', 'Test', 'Voyageur', 'test.voyageur.cascade@email.com', 'Actif', $1, 16, 'Rachid Baassid', $2, '{}')
     RETURNING *`,
    [statutMetier, mandatStatus]
  );
  return rows[0];
}

async function run() {
  console.log('\n=== VOYAGEUR CASCADE TESTS ===\n');

  // Rule 1: Brouillon + En recherche → no records
  {
    console.log('Rule 1: Brouillon + En recherche → no records');
    const c = await createClient('Brouillon', 'En recherche');
    await onClientStatusChange(c.id, 'Brouillon', 'En recherche', 'Voyageur', 'Test Voyageur', 'Rachid Baassid', '16', undefined);
    await assert('no tx', (await getTx(c.id)), null);
    await assert('no reg', (await getReg(c.id)), null);
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 2: En attente + Reservation en cours → tx actif, reg reservation, ctr en_cours
  {
    console.log('Rule 2: En attente + Réservation en cours → reg reservation, ctr en_cours');
    const c = await createClient('En attente', 'Reservation en cours');
    await onClientStatusChange(c.id, 'En attente', 'Reservation en cours', 'Voyageur', 'Test Voyageur', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = location_saisonniere', (await getTx(c.id)).type, 'location_saisonniere');
    await assert('reg = reservation, type = location_saisonniere', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'reservation', type: 'location_saisonniere' });
    await assert('ctr = en_cours, type = location_saisonniere', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'en_cours', type: 'location_saisonniere' });
    await clean(c.id);
  }

  // Rule 3: Actif + Confirme → tx actif, reg signe, ctr confirme_actif
  {
    console.log('Rule 3: Actif + Confirmé → reg signe, ctr confirme_actif');
    const c = await createClient('Actif', 'Confirme');
    await onClientStatusChange(c.id, 'Actif', 'Confirme', 'Voyageur', 'Test Voyageur', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = location_saisonniere', (await getTx(c.id)).type, 'location_saisonniere');
    await assert('reg = signe, type = location_saisonniere', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'signe', type: 'location_saisonniere' });
    await assert('ctr = confirme_actif, type = location_saisonniere', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'confirme_actif', type: 'location_saisonniere' });
    await clean(c.id);
  }

  // Rule 4: Actif + Paye → tx actif, reg signe, ctr paye
  {
    console.log('Rule 4: Actif + Payé → reg signe, ctr paye');
    const c = await createClient('Actif', 'Paye');
    await onClientStatusChange(c.id, 'Actif', 'Paye', 'Voyageur', 'Test Voyageur', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = location_saisonniere', (await getTx(c.id)).type, 'location_saisonniere');
    await assert('reg = signe, type = location_saisonniere', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'signe', type: 'location_saisonniere' });
    await assert('ctr = paye, type = location_saisonniere', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'paye', type: 'location_saisonniere' });
    await clean(c.id);
  }

  // Rule 5: Actif + En sejour → tx actif, reg actif, ctr occupe
  {
    console.log('Rule 5: Actif + En séjour → reg actif, ctr occupe');
    const c = await createClient('Actif', 'En sejour');
    await onClientStatusChange(c.id, 'Actif', 'En sejour', 'Voyageur', 'Test Voyageur', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = location_saisonniere', (await getTx(c.id)).type, 'location_saisonniere');
    await assert('reg = actif, type = location_saisonniere', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'actif', type: 'location_saisonniere' });
    await assert('ctr = occupe, type = location_saisonniere', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'occupe', type: 'location_saisonniere' });
    await clean(c.id);
  }

  // Rule 6: Terminé + Terminé → tx cloture, reg cloture, ctr finalise_termine
  {
    console.log('Rule 6: Terminé + Terminé → reg cloture, ctr finalise_termine');
    const c = await createClient('Terminé', 'Termine');
    await onClientStatusChange(c.id, 'Terminé', 'Termine', 'Voyageur', 'Test Voyageur', 'Rachid Baassid', '16', undefined);
    await assert('tx = cloture', (await getTx(c.id)).etape, 'cloture');
    await assert('tx type = location_saisonniere', (await getTx(c.id)).type, 'location_saisonniere');
    await assert('reg = cloture, type = location_saisonniere', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'cloture', type: 'location_saisonniere' });
    await assert('ctr = finalise_termine, type = location_saisonniere', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'finalise_termine', type: 'location_saisonniere' });
    await clean(c.id);
  }

  // Rule 7: Annulé + Annule → tx resilie, reg annule, ctr annule
  {
    console.log('Rule 7: Annulé + Annulé → reg annule, ctr annule');
    const c = await createClient('Annulé', 'Annule');
    await onClientStatusChange(c.id, 'Annulé', 'Annule', 'Voyageur', 'Test Voyageur', 'Rachid Baassid', '16', undefined);
    await assert('tx = resilie', (await getTx(c.id)).etape, 'resilie');
    await assert('tx type = location_saisonniere', (await getTx(c.id)).type, 'location_saisonniere');
    await assert('reg = annule, type = location_saisonniere', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'annule', type: 'location_saisonniere' });
    await assert('ctr = annule, type = location_saisonniere', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'annule', type: 'location_saisonniere' });
    await clean(c.id);
  }

  // Rule 8: Inactif + Inactif → tx expire, reg annule, ctr annule
  {
    console.log('Rule 8: Inactif + Inactif → reg annule, ctr annule');
    const c = await createClient('Inactif', 'Inactif');
    await onClientStatusChange(c.id, 'Inactif', 'Inactif', 'Voyageur', 'Test Voyageur', 'Rachid Baassid', '16', undefined);
    await assert('tx = expire', (await getTx(c.id)).etape, 'expire');
    await assert('tx type = location_saisonniere', (await getTx(c.id)).type, 'location_saisonniere');
    await assert('reg = annule, type = location_saisonniere', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'annule', type: 'location_saisonniere' });
    await assert('ctr = annule, type = location_saisonniere', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'annule', type: 'location_saisonniere' });
    await clean(c.id);
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
