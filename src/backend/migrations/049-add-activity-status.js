export async function up(pg) {
  await pg.query(`
    ALTER TABLE client_activities
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    ADD COLUMN IF NOT EXISTS cancellation_notified BOOLEAN NOT NULL DEFAULT FALSE
  `);

  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_client_activities_status ON client_activities(status)
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE client_activities
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS cancellation_notified
  `);

  await pg.query(`
    DROP INDEX IF EXISTS idx_client_activities_status
  `);
}
