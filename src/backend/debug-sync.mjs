import pool from './config/db.js';

async function run() {
  const clients = await pool.query(
    `SELECT id, client_type, first_name, last_name, email, status, statut_metier, mandat_status, data
     FROM owner_clients
     WHERE email ILIKE '%nihad%' OR first_name ILIKE '%nihad%' OR last_name ILIKE '%nihad%' OR data->>'name' ILIKE '%nihad%'`
  );
  console.log('=== CLIENTS matching Nihad ===');
  for (const r of clients.rows) {
    console.log(JSON.stringify({ id: r.id, type: r.client_type, first: r.first_name, last: r.last_name, email: r.email, status: r.status, statutMetier: r.statut_metier, mandatStatus: r.mandat_status, data: r.data }, null, 2));
  }

  const res = await pool.query(
    `SELECT id, property_id, client_id, client_name, start_date, end_date, nights, adults, children, grand_total, status
     FROM reservations ORDER BY created_at DESC LIMIT 10`
  );
  console.log('=== RECENT RESERVATIONS ===');
  for (const r of res.rows) {
    console.log(JSON.stringify(r));
  }
  await pool.end();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
