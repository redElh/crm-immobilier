export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL DEFAULT 'visit',
      title VARCHAR(255) NOT NULL DEFAULT '',
      start_at TIMESTAMPTZ NOT NULL,
      end_at TIMESTAMPTZ NOT NULL,
      all_day BOOLEAN NOT NULL DEFAULT FALSE,
      agent_id INTEGER NOT NULL,
      agent_ids JSONB NOT NULL DEFAULT '[]',
      client_name VARCHAR(255) NOT NULL DEFAULT '',
      client_phone VARCHAR(50) NOT NULL DEFAULT '',
      client_email VARCHAR(255) NOT NULL DEFAULT '',
      property_name VARCHAR(255) NOT NULL DEFAULT '',
      property_ref VARCHAR(100) NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      google_sync BOOLEAN NOT NULL DEFAULT FALSE,
      reminders JSONB NOT NULL DEFAULT '[]',
      created_by VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_calendar_events_agent_id ON calendar_events(agent_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events(start_at)`);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS calendar_events`);
}
