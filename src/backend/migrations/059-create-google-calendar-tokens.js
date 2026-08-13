export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS google_calendar_tokens (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL DEFAULT '',
      token_expiry TIMESTAMPTZ,
      google_email TEXT NOT NULL DEFAULT '',
      calendar_id TEXT NOT NULL DEFAULT 'primary',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS google_calendar_tokens`);
}
