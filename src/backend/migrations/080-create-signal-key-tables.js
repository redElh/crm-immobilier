export async function up(pg) {
  await pg.query(`
    CREATE TABLE signal_identities (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      identity_key TEXT NOT NULL,
      registration_id INTEGER NOT NULL,
      signed_prekey_id INTEGER NOT NULL DEFAULT 1,
      signed_prekey_pub TEXT NOT NULL,
      signed_prekey_sig TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query(`
    CREATE TABLE signal_prekeys (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_id INTEGER NOT NULL,
      public_key TEXT NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, key_id)
    )
  `);

  await pg.query(`
    CREATE INDEX idx_signal_prekeys_available
    ON signal_prekeys (user_id)
    WHERE used = false
  `);
}

export async function down(pg) {
  await pg.query('DROP INDEX IF EXISTS idx_signal_prekeys_available');
  await pg.query('DROP TABLE IF EXISTS signal_prekeys');
  await pg.query('DROP TABLE IF EXISTS signal_identities');
}
