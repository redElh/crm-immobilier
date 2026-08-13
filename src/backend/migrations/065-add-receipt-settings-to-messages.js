export async function up(pg) {
  await pg.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS receipt_settings JSONB
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE messages DROP COLUMN IF EXISTS receipt_settings
  `);
}
