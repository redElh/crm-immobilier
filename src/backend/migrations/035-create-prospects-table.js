export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS prospects (
      id SERIAL PRIMARY KEY,
      prospect_type VARCHAR(50) NOT NULL DEFAULT 'Acheter',
      origin VARCHAR(100) NOT NULL DEFAULT '',
      prospect_date VARCHAR(50) NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      civility VARCHAR(10) NOT NULL DEFAULT 'M.',
      first_name VARCHAR(100) NOT NULL DEFAULT '',
      last_name VARCHAR(100) NOT NULL DEFAULT '',
      email VARCHAR(255) NOT NULL DEFAULT '',
      phone VARCHAR(50) NOT NULL DEFAULT '',
      mobile VARCHAR(50) NOT NULL DEFAULT '',
      spoken_language VARCHAR(50) NOT NULL DEFAULT '',
      means_of_contact JSONB NOT NULL DEFAULT '[]',
      categories VARCHAR(100) NOT NULL DEFAULT '',
      property_types JSONB NOT NULL DEFAULT '[]',
      location VARCHAR(255) NOT NULL DEFAULT '',
      rooms INTEGER,
      bedrooms INTEGER,
      min_surface INTEGER,
      max_price NUMERIC,
      currency VARCHAR(20) NOT NULL DEFAULT 'MAD',
      view_type VARCHAR(100) NOT NULL DEFAULT '',
      view_detail VARCHAR(100) NOT NULL DEFAULT '',
      status VARCHAR(50) NOT NULL DEFAULT 'Nouveau',
      agent_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_prospects_last_name ON prospects(last_name)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_prospects_agent_id ON prospects(agent_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status)`);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS prospects`);
}
