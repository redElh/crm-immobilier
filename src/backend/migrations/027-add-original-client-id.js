export async function up(pg) {
  await pg.query(`
    ALTER TABLE owner_clients
      ADD COLUMN IF NOT EXISTS original_client_id INTEGER REFERENCES owner_clients(id) ON DELETE CASCADE
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_owner_clients_original_client_id ON owner_clients(original_client_id)
  `);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_owner_clients_original_client_id`);
  await pg.query(`ALTER TABLE owner_clients DROP COLUMN IF EXISTS original_client_id`);
}
