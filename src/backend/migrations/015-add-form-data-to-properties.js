export async function up(pg) {
  await pg.query(`
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE properties DROP COLUMN IF EXISTS form_data
  `);
}
