export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS client_activities (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES owner_clients(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL DEFAULT 'note',
      direction VARCHAR(20) DEFAULT '',
      subject VARCHAR(255) DEFAULT '',
      description TEXT DEFAULT '',
      activity_date TIMESTAMP NOT NULL DEFAULT NOW(),
      has_reminder BOOLEAN DEFAULT FALSE,
      reminder_date TIMESTAMP,
      is_important BOOLEAN DEFAULT FALSE,
      author_id INTEGER REFERENCES users(id),
      author_name VARCHAR(150) DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_client_activities_type ON client_activities(type)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_client_activities_date ON client_activities(activity_date DESC)`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_client_activities_date`);
  await pg.query(`DROP INDEX IF EXISTS idx_client_activities_type`);
  await pg.query(`DROP INDEX IF EXISTS idx_client_activities_client_id`);
  await pg.query(`DROP TABLE IF EXISTS client_activities`);
}
