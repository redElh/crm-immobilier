export async function up(pg) {
  await pg.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'actif',
      ADD COLUMN IF NOT EXISTS inactivity_email_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS suspension_email_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS last_login_at,
      DROP COLUMN IF EXISTS last_activity_at,
      DROP COLUMN IF EXISTS status,
      DROP COLUMN IF EXISTS inactivity_email_sent_at,
      DROP COLUMN IF EXISTS suspension_email_sent_at,
      DROP COLUMN IF EXISTS require_password_change,
      DROP COLUMN IF EXISTS scheduled_deletion_at
  `);
}
