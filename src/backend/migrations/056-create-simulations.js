export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS simulations (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES owner_clients(id) ON DELETE SET NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'capacite',
      financing_type VARCHAR(50) NOT NULL DEFAULT 'pret_bancaire',
      revenus NUMERIC(12,2) DEFAULT 0,
      prix_bien NUMERIC(12,2) DEFAULT 0,
      capacite NUMERIC(12,2) DEFAULT 0,
      mensualite NUMERIC(12,2) DEFAULT 0,
      apport NUMERIC(12,2) DEFAULT 0,
      taux_interet NUMERIC(5,2) DEFAULT 0,
      duree_annees INTEGER DEFAULT 0,
      frais_notaire NUMERIC(12,2) DEFAULT 0,
      endettement_max NUMERIC(5,2) DEFAULT 0,
      taux_assurance NUMERIC(5,2) DEFAULT 0,
      frais_dossier NUMERIC(12,2) DEFAULT 0,
      garantie NUMERIC(5,2) DEFAULT 0,
      description_autre_financement TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      client_name VARCHAR(255) DEFAULT '',
      client_email VARCHAR(255) DEFAULT '',
      created_by VARCHAR(50) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS simulations`);
}
