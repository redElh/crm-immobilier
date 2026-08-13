// Add property + buyer references to "Visite" activities so they can carry
// the data needed to generate a "Bon de visite".
export async function up(pg) {
  await pg.query(`
    ALTER TABLE client_activities
    ADD COLUMN IF NOT EXISTS visit_property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS visit_buyer_id INTEGER REFERENCES owner_clients(id) ON DELETE SET NULL
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_client_activities_visit_property ON client_activities(visit_property_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_client_activities_visit_buyer ON client_activities(visit_buyer_id)`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_client_activities_visit_buyer`);
  await pg.query(`DROP INDEX IF EXISTS idx_client_activities_visit_property`);
  await pg.query(`ALTER TABLE client_activities DROP COLUMN IF EXISTS visit_property_id, DROP COLUMN IF EXISTS visit_buyer_id`);
}
