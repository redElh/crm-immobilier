export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      reference VARCHAR(50) UNIQUE NOT NULL,
      client_id INTEGER NOT NULL REFERENCES owner_clients(id) ON DELETE CASCADE,
      client_name VARCHAR(255) DEFAULT '',
      client_type VARCHAR(50) DEFAULT '',
      property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
      property_title VARCHAR(255) DEFAULT '',
      property_ref VARCHAR(50) DEFAULT '',
      type VARCHAR(50) NOT NULL DEFAULT 'simple',
      etape VARCHAR(50) DEFAULT 'actif',
      role VARCHAR(50) DEFAULT '',
      date_contracted DATE DEFAULT CURRENT_DATE,
      date_reservation DATE,
      date_expiration DATE,
      montant VARCHAR(100) DEFAULT '',
      agent_name VARCHAR(255) DEFAULT '',
      agent_id VARCHAR(50) DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query(`CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON transactions(property_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_transactions_etape ON transactions(etape)`);

  await pg.query(`
    CREATE TABLE IF NOT EXISTS registre (
      id SERIAL PRIMARY KEY,
      reference VARCHAR(50) UNIQUE NOT NULL,
      transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
      client_id INTEGER NOT NULL REFERENCES owner_clients(id) ON DELETE CASCADE,
      client_name VARCHAR(255) DEFAULT '',
      client_type VARCHAR(50) DEFAULT '',
      property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
      property_title VARCHAR(255) DEFAULT '',
      property_ref VARCHAR(50) DEFAULT '',
      type VARCHAR(50) NOT NULL,
      etape VARCHAR(50) DEFAULT 'actif',
      role VARCHAR(50) DEFAULT '',
      montant VARCHAR(100) DEFAULT '',
      agent_name VARCHAR(255) DEFAULT '',
      agent_id VARCHAR(50) DEFAULT '',
      date_contrat DATE,
      date_expiration DATE,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query(`CREATE INDEX IF NOT EXISTS idx_registre_client_id ON registre(client_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_registre_transaction_id ON registre(transaction_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_registre_type ON registre(type)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_registre_etape ON registre(etape)`);

  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_name VARCHAR(255) DEFAULT ''`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT ''`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS property_title VARCHAR(255) DEFAULT ''`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS property_ref VARCHAR(50) DEFAULT ''`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reference VARCHAR(50) DEFAULT ''`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT ''`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS agent_name VARCHAR(255) DEFAULT ''`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS agent_id VARCHAR(50) DEFAULT ''`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS date_reservation DATE`);
  await pg.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS date_expiration DATE`);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS registre`);
  await pg.query(`DROP TABLE IF EXISTS transactions`);
}
