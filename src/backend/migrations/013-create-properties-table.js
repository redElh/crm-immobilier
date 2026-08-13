export async function up(pg) {
  await pg.query(`DROP TABLE IF EXISTS properties CASCADE`);
  await pg.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      reference VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      property_type VARCHAR(50) NOT NULL DEFAULT 'residential',
      transaction_type VARCHAR(50) NOT NULL DEFAULT 'vente',
      status VARCHAR(50) NOT NULL DEFAULT 'for_sale',
      price NUMERIC(12,2),
      price_min NUMERIC(12,2),
      price_max NUMERIC(12,2),
      surface NUMERIC(10,2),
      land_size NUMERIC(10,2),
      bedrooms INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 0,
      rooms INTEGER DEFAULT 0,
      sleeping_capacity INTEGER,
      location TEXT,
      address TEXT,
      city VARCHAR(100),
      district VARCHAR(100),
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      description TEXT,
      features JSONB DEFAULT '[]',
      images JSONB DEFAULT '[]',
      documents JSONB DEFAULT '[]',
      year_built INTEGER,
      dpe JSONB,
      mandate_type VARCHAR(50),
      property_state VARCHAR(50),
      is_seasonal BOOLEAN DEFAULT FALSE,
      owner JSONB DEFAULT '{"id":"","name":"","phone":"","email":""}',
      agent_id VARCHAR(50),
      mandate_status VARCHAR(20) DEFAULT 'actif',
      mandate_start_date DATE,
      mandate_end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type)
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id)
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS properties`);
}
