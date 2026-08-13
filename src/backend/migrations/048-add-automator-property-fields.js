export async function up(pg) {
  await pg.query(`
    ALTER TABLE automator_triggered_notifications
    ADD COLUMN IF NOT EXISTS createur_role VARCHAR(50) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS bien_type VARCHAR(100) NOT NULL DEFAULT ''
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE automator_triggered_notifications
    DROP COLUMN IF EXISTS createur_role,
    DROP COLUMN IF EXISTS bien_type
  `);
}
