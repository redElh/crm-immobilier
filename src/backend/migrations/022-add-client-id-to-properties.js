export async function up(pg) {
  await pg.query(`
    ALTER TABLE properties
      ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES owner_clients(id) ON DELETE SET NULL
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_properties_client_id ON properties(client_id)
  `);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_properties_client_id`);
  await pg.query(`ALTER TABLE properties DROP COLUMN IF EXISTS client_id`);
}
