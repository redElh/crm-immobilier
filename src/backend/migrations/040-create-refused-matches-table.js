import pool from '../config/db.js';

export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS refused_matches (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES owner_clients(id) ON DELETE CASCADE,
      agent_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(property_id, client_id)
    )
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_refused_matches_property_id ON refused_matches(property_id)
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_refused_matches_client_id ON refused_matches(client_id)
  `);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_refused_matches_client_id`);
  await pg.query(`DROP INDEX IF EXISTS idx_refused_matches_property_id`);
  await pg.query(`DROP TABLE IF EXISTS refused_matches`);
}
