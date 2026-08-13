export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      module VARCHAR(50) NOT NULL,
      permission_key VARCHAR(100) NOT NULL,
      value VARCHAR(10) NOT NULL DEFAULT 'défaut',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, module, permission_key)
    )
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)`);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS user_permissions`);
}
