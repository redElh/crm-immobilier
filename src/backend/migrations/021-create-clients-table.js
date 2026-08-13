export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS owner_clients (
      id SERIAL PRIMARY KEY,
      client_type VARCHAR(50) NOT NULL DEFAULT 'vendeur',
      first_name VARCHAR(100) NOT NULL DEFAULT '',
      last_name VARCHAR(100) NOT NULL DEFAULT '',
      email VARCHAR(255) NOT NULL DEFAULT '',
      phone VARCHAR(50) NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      profession VARCHAR(255) NOT NULL DEFAULT '',
      company_name VARCHAR(255) NOT NULL DEFAULT '',
      legal_form VARCHAR(100) NOT NULL DEFAULT '',
      siren VARCHAR(50) NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status VARCHAR(50) NOT NULL DEFAULT 'actif',
      agent_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_owner_clients_agent_id ON owner_clients(agent_id)
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_owner_clients_client_type ON owner_clients(client_type)
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS owner_clients CASCADE`);
}
