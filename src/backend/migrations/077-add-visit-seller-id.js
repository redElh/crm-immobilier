// Add a seller (vendeur) reference to "Visite" activities so visits created
// from the acheteur side can carry the vendeur in charge of the property.
export async function up(pg) {
  await pg.query(`
    ALTER TABLE client_activities
    ADD COLUMN IF NOT EXISTS visit_seller_id INTEGER REFERENCES owner_clients(id) ON DELETE SET NULL
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_client_activities_visit_seller ON client_activities(visit_seller_id)`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_client_activities_visit_seller`);
  await pg.query(`ALTER TABLE client_activities DROP COLUMN IF EXISTS visit_seller_id`);
}
