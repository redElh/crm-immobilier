export async function up(pg) {
  await pg.query(`
    ALTER TABLE owner_clients
      ADD COLUMN IF NOT EXISTS statut_metier VARCHAR(50) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS mandat_status VARCHAR(50) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS mandat_id INTEGER REFERENCES properties(id) ON DELETE SET NULL
  `);

  await pg.query(`
    CREATE TABLE IF NOT EXISTS contracts (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES owner_clients(id) ON DELETE CASCADE,
      property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
      contract_type VARCHAR(50) NOT NULL DEFAULT 'location_saisonniere',
      status VARCHAR(50) NOT NULL DEFAULT 'en_cours',
      start_date DATE,
      end_date DATE,
      amount NUMERIC(12,2),
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id)
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON contracts(property_id)
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_owner_clients_statut_metier ON owner_clients(statut_metier)
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS contracts CASCADE`);
  await pg.query(`
    ALTER TABLE owner_clients
      DROP COLUMN IF EXISTS statut_metier,
      DROP COLUMN IF EXISTS mandat_status,
      DROP COLUMN IF EXISTS mandat_id
  `);
}
