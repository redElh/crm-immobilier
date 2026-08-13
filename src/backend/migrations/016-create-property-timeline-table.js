export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS property_timeline (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      type VARCHAR(100) NOT NULL,
      agent VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_property_timeline_property_id ON property_timeline(property_id)
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_property_timeline_type ON property_timeline(type)
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS property_timeline`);
}
