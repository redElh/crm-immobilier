export async function up(pg) {
  await pg.query(`
    ALTER TABLE user_messaging_settings
      ADD COLUMN IF NOT EXISTS last_digest_unread INT NOT NULL DEFAULT 0
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE user_messaging_settings DROP COLUMN IF EXISTS last_digest_unread
  `);
}
