export async function up(pg) {
  await pg.query(`
    CREATE TABLE user_messaging_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_digest_sent_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function down(pg) {
  await pg.query('DROP TABLE IF EXISTS user_messaging_settings');
}
