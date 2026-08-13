export async function up(pg) {
  await pg.query(`
    CREATE TABLE sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      device_browser VARCHAR(255),
      device_os VARCHAR(255),
      ip_address VARCHAR(45),
      location_city VARCHAR(100),
      location_country VARCHAR(100),
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      expires_at TIMESTAMP NOT NULL
    )
  `);
  await pg.query(`
    CREATE INDEX idx_sessions_user_id ON sessions(user_id)
  `);
  await pg.query(`
    CREATE INDEX idx_sessions_session_token ON sessions(session_token)
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS sessions`);
}
