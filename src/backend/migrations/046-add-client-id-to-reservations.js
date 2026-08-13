export async function up(pg) {
  await pg.query(`
    ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES owner_clients(id) ON DELETE SET NULL
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON reservations(client_id)`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_reservations_client_id`);
  await pg.query(`ALTER TABLE reservations DROP COLUMN IF EXISTS client_id`);
}
