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
     VALUES ('Bailleur', 'Test', 'Bailleur', 'test.bailleur.cascade@email.com', 'Actif', $1, 16, 'Rachid Baassid', $2, '{}')
     RETURNING *`,
    [statutMetier, mandatStatus]
  );
  return rows[0];
}

async function run() {
  console.log('\n=== BAILLEUR CASCADE TESTS ===\n');

  // Rule 1: Non défini → En attente de signature → no records
  {
    console.log('Rule 1: Non défini → En attente de signature');
    const c = await createClient('Non défini', 'En attente de signature');
    await onClientStatusChange(c.id, 'Non défini', 'En attente de signature', 'Bailleur', 'Test Bailleur', 'Rachid Baassid', '16', undefined);
    await assert('no tx', (await getTx(c.id)), null);
    await assert('no reg', (await getReg(c.id)), null);
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 2: En attente de signature → tx en_attente, no reg, no ctr
  {
    console.log('Rule 2: En attente de signature');
    const c = await createClient('En attente de signature', 'En attente de signature');
    await onClientStatusChange(c.id, 'En attente de signature', 'En attente de signature', 'Bailleur', 'Test Bailleur', 'Rachid Baassid', '16', undefined);
    await assert('tx = en_attente', (await getTx(c.id)).etape, 'en_attente');
    await assert('tx type = location_gestion', (await getTx(c.id)).type, 'location_gestion');
    await assert('no reg', (await getReg(c.id)), null);
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 3: Actif + En mandat → tx actif, reg actif, no ctr
  {
    console.log('Rule 3: Actif + En mandat');
    const c = await createClient('Actif', 'En mandat');
    await onClientStatusChange(c.id, 'Actif', 'En mandat', 'Bailleur', 'Test Bailleur', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = location_gestion', (await getTx(c.id)).type, 'location_gestion');
    await assert('reg = actif, type = location_gestion', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'actif', type: 'location_gestion' });
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 4: Actif + En négociation → tx actif, reg actif, no ctr
  {
    console.log('Rule 4: Actif + En négociation');
    const c = await createClient('Actif', 'En negociation');
    await onClientStatusChange(c.id, 'Actif', 'En negociation', 'Bailleur', 'Test Bailleur', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = location_gestion', (await getTx(c.id)).type, 'location_gestion');
    await assert('reg = actif, type = location_gestion', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'actif', type: 'location_gestion' });
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 5: Actif + En location → tx actif, reg reservation, ctr location_classique/en_cours
  {
    console.log('Rule 5: Actif + En location');
    const c = await createClient('Actif', 'En location');
    await onClientStatusChange(c.id, 'Actif', 'En location', 'Bailleur', 'Test Bailleur', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = location_gestion', (await getTx(c.id)).type, 'location_gestion');
    await assert('reg = reservation, type = location_gestion', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'reservation', type: 'location_gestion' });
    await assert('ctr = en_cours, type = location_classique', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'en_cours', type: 'location_classique' });
    await clean(c.id);
  }

  // Rule 6: Terminé + Loué → tx cloture, reg cloture, ctr finalise_termine
  {
    console.log('Rule 6: Terminé + Loué');
    const c = await createClient('Termine', 'Loue');
    await onClientStatusChange(c.id, 'Termine', 'Loue', 'Bailleur', 'Test Bailleur', 'Rachid Baassid', '16', undefined);
    await assert('tx = cloture', (await getTx(c.id)).etape, 'cloture');
    await assert('tx type = location_gestion', (await getTx(c.id)).type, 'location_gestion');
    await assert('reg = cloture, type = location_gestion', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'cloture', type: 'location_gestion' });
    await assert('ctr = finalise_termine, type = location_classique', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'finalise_termine', type: 'location_classique' });
    await clean(c.id);
  }

  // Rule 7: Expiré + Inactif → tx expire, reg expire, no ctr
  {
    console.log('Rule 7: Expiré + Inactif');
    const c = await createClient('Expire', 'Inactif');
    await onClientStatusChange(c.id, 'Expire', 'Inactif', 'Bailleur', 'Test Bailleur', 'Rachid Baassid', '16', undefined);
    await assert('tx = expire', (await getTx(c.id)).etape, 'expire');
    await assert('tx type = location_gestion', (await getTx(c.id)).type, 'location_gestion');
    await assert('reg = expire, type = location_gestion', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'expire', type: 'location_gestion' });
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 8: Résilié + Perdu → tx resilie, reg resilie, no ctr
  {
    console.log('Rule 8: Résilié + Perdu');
    const c = await createClient('Resilie', 'Perdu');
    await onClientStatusChange(c.id, 'Resilie', 'Perdu', 'Bailleur', 'Test Bailleur', 'Rachid Baassid', '16', undefined);
    await assert('tx = resilie', (await getTx(c.id)).etape, 'resilie');
    await assert('tx type = location_gestion', (await getTx(c.id)).type, 'location_gestion');
    await assert('reg = resilie, type = location_gestion', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'resilie', type: 'location_gestion' });
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
