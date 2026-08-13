export async function up(pg) {
  await pg.query(`
    ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS original_property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_properties_original_property_id ON properties(original_property_id)
  `);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_properties_original_property_id`);
  await pg.query(`ALTER TABLE properties DROP COLUMN IF EXISTS original_property_id`);
}
