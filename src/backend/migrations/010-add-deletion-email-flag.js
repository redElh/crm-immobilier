export async function up(pg) {
  await pg.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS deletion_email_sent_at TIMESTAMP
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS deletion_email_sent_at
  `);
}
