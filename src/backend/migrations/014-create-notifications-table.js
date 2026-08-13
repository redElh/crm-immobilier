export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      sender_name VARCHAR(100) NOT NULL DEFAULT '',
      type VARCHAR(50) NOT NULL DEFAULT 'property_assigned',
      message TEXT NOT NULL DEFAULT '',
      property_id VARCHAR(50) NOT NULL DEFAULT '',
      property_ref VARCHAR(50) NOT NULL DEFAULT '',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS notifications`);
}
