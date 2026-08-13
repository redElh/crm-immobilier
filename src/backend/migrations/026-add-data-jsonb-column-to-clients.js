export async function up(pg) {
  await pg.query(`
    ALTER TABLE owner_clients
      ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE owner_clients
      DROP COLUMN IF EXISTS data
  `);
}
