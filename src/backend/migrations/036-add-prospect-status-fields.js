export async function up(pg) {
  await pg.query(`
    ALTER TABLE prospects
    ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS reminder_note TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS qualification_data JSONB
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_prospects_reminder_date ON prospects(reminder_date) WHERE reminder_date IS NOT NULL`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_prospects_qualified_at ON prospects(qualified_at)`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_prospects_reminder_date`);
  await pg.query(`DROP INDEX IF EXISTS idx_prospects_qualified_at`);
  await pg.query(`ALTER TABLE prospects DROP COLUMN IF EXISTS reminder_date, DROP COLUMN IF EXISTS reminder_note, DROP COLUMN IF EXISTS qualified_at, DROP COLUMN IF EXISTS contacted_at, DROP COLUMN IF EXISTS qualification_data`);
}
