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
     VALUES ('Locataire', 'Test', 'Locataire', 'test.locataire.cascade@email.com', 'Actif', $1, 16, 'Rachid Baassid', $2, '{}')
     RETURNING *`,
    [statutMetier, mandatStatus]
  );
  return rows[0];
}

async function run() {
  console.log('\n=== LOCATAIRE CASCADE TESTS ===\n');

  // Rule 1: Non défini + En recherche → no records
  {
    console.log('Rule 1: Non défini + En recherche → no records');
    const c = await createClient('Non défini', 'En recherche');
    await onClientStatusChange(c.id, 'Non défini', 'En recherche', 'Locataire', 'Test Locataire', 'Rachid Baassid', '16', undefined);
    await assert('no tx', (await getTx(c.id)), null);
    await assert('no reg', (await getReg(c.id)), null);
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 2: En attente de signature + En recherche → tx en_attente, no reg, no ctr
  {
    console.log('Rule 2: En attente de signature + En recherche → tx en_attente');
    const c = await createClient('En attente de signature', 'En recherche');
    await onClientStatusChange(c.id, 'En attente de signature', 'En recherche', 'Locataire', 'Test Locataire', 'Rachid Baassid', '16', undefined);
    await assert('tx = en_attente', (await getTx(c.id)).etape, 'en_attente');
    await assert('tx type = recherche_location', (await getTx(c.id)).type, 'recherche_location');
    await assert('no reg', (await getReg(c.id)), null);
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 3: Actif + En visite → tx actif, reg actif, no ctr
  {
    console.log('Rule 3: Actif + En visite → tx actif, reg actif');
    const c = await createClient('Actif', 'En visite');
    await onClientStatusChange(c.id, 'Actif', 'En visite', 'Locataire', 'Test Locataire', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = recherche_location', (await getTx(c.id)).type, 'recherche_location');
    await assert('reg = actif, type = recherche_location', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'actif', type: 'recherche_location' });
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 4: Actif + En dossier → tx actif, reg actif, no ctr
  {
    console.log('Rule 4: Actif + En dossier → tx actif, reg actif');
    const c = await createClient('Actif', 'En dossier');
    await onClientStatusChange(c.id, 'Actif', 'En dossier', 'Locataire', 'Test Locataire', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = recherche_location', (await getTx(c.id)).type, 'recherche_location');
    await assert('reg = actif, type = recherche_location', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'actif', type: 'recherche_location' });
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 5: Actif + Bail signe → tx actif, reg reservation, ctr location_classique/en_cours
  {
    console.log('Rule 5: Actif + Bail signé → tx actif, reg reservation, ctr en_cours');
    const c = await createClient('Actif', 'Bail signe');
    await onClientStatusChange(c.id, 'Actif', 'Bail signe', 'Locataire', 'Test Locataire', 'Rachid Baassid', '16', undefined);
    await assert('tx = actif', (await getTx(c.id)).etape, 'actif');
    await assert('tx type = recherche_location', (await getTx(c.id)).type, 'recherche_location');
    await assert('reg = reservation, type = recherche_location', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'reservation', type: 'recherche_location' });
    await assert('ctr = en_cours, type = location_classique', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'en_cours', type: 'location_classique' });
    await clean(c.id);
  }

  // Rule 6: Terminé + Installé → tx cloture, reg cloture, ctr finalise_termine
  {
    console.log('Rule 6: Terminé + Installé → tx cloture, reg cloture, ctr finalise_termine');
    const c = await createClient('Termine', 'Installe');
    await onClientStatusChange(c.id, 'Termine', 'Installe', 'Locataire', 'Test Locataire', 'Rachid Baassid', '16', undefined);
    await assert('tx = cloture', (await getTx(c.id)).etape, 'cloture');
    await assert('tx type = recherche_location', (await getTx(c.id)).type, 'recherche_location');
    await assert('reg = cloture, type = recherche_location', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'cloture', type: 'recherche_location' });
    await assert('ctr = finalise_termine, type = location_classique', { status: (await getCtr(c.id)).status, type: (await getCtr(c.id)).contract_type }, { status: 'finalise_termine', type: 'location_classique' });
    await clean(c.id);
  }

  // Rule 7: Expiré + Inactif → tx expire, reg expire, no ctr
  {
    console.log('Rule 7: Expiré + Inactif → tx expire, reg expire');
    const c = await createClient('Expire', 'Inactif');
    await onClientStatusChange(c.id, 'Expire', 'Inactif', 'Locataire', 'Test Locataire', 'Rachid Baassid', '16', undefined);
    await assert('tx = expire', (await getTx(c.id)).etape, 'expire');
    await assert('tx type = recherche_location', (await getTx(c.id)).type, 'recherche_location');
    await assert('reg = expire, type = recherche_location', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'expire', type: 'recherche_location' });
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  // Rule 8: Résilié + Perdu → tx resilie, reg resilie, no ctr
  {
    console.log('Rule 8: Résilié + Perdu → tx resilie, reg resilie');
    const c = await createClient('Resilie', 'Perdu');
    await onClientStatusChange(c.id, 'Resilie', 'Perdu', 'Locataire', 'Test Locataire', 'Rachid Baassid', '16', undefined);
    await assert('tx = resilie', (await getTx(c.id)).etape, 'resilie');
    await assert('tx type = recherche_location', (await getTx(c.id)).type, 'recherche_location');
    await assert('reg = resilie, type = recherche_location', { etape: (await getReg(c.id)).etape, type: (await getReg(c.id)).type }, { etape: 'resilie', type: 'recherche_location' });
    await assert('no ctr', (await getCtr(c.id)), null);
    await clean(c.id);
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
