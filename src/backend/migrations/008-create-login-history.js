export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS login_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      device_browser VARCHAR(255),
      device_os VARCHAR(255),
      ip_address VARCHAR(45),
      location_city VARCHAR(100),
      location_country VARCHAR(100),
      status VARCHAR(20) NOT NULL,
      failure_reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query('CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id)');
  await pg.query('CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at)');
}

export async function down(pg) {
  await pg.query('DROP TABLE IF EXISTS login_history');
}
