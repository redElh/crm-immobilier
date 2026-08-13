export async function up(pg) {
  await pg.query(`
    ALTER TABLE owner_clients
      ADD COLUMN IF NOT EXISTS agent_designe VARCHAR(255) NOT NULL DEFAULT ''
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE owner_clients
      DROP COLUMN IF EXISTS agent_designe
  `);
}
