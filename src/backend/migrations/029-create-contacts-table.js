export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      contact_type VARCHAR(50) NOT NULL DEFAULT 'Particulier',
      civility VARCHAR(10) NOT NULL DEFAULT 'M.',
      first_name VARCHAR(100) NOT NULL DEFAULT '',
      last_name VARCHAR(100) NOT NULL DEFAULT '',
      email_principal VARCHAR(255) NOT NULL DEFAULT '',
      email_secondaire VARCHAR(255) NOT NULL DEFAULT '',
      mobile VARCHAR(50) NOT NULL DEFAULT '',
      telephone_fixe VARCHAR(50) NOT NULL DEFAULT '',
      profession VARCHAR(255) NOT NULL DEFAULT '',
      lieu_naissance VARCHAR(255) NOT NULL DEFAULT '',
      date_naissance VARCHAR(50) NOT NULL DEFAULT '',
      nationalite VARCHAR(100) NOT NULL DEFAULT '',
      numero_fiscal VARCHAR(100) NOT NULL DEFAULT '',
      adresse TEXT NOT NULL DEFAULT '',
      adresse2 TEXT NOT NULL DEFAULT '',
      code_postal VARCHAR(20) NOT NULL DEFAULT '',
      ville VARCHAR(100) NOT NULL DEFAULT '',
      pays VARCHAR(100) NOT NULL DEFAULT '',
      moyen_contact_prefere VARCHAR(50) NOT NULL DEFAULT '',
      langue_parlee JSONB NOT NULL DEFAULT '[]',
      devise_preferee VARCHAR(20) NOT NULL DEFAULT '',
      situation_familiale VARCHAR(50) NOT NULL DEFAULT '',
      nombre_enfants INTEGER,
      prescripteur VARCHAR(255) NOT NULL DEFAULT '',
      regime_matrimonial VARCHAR(100) NOT NULL DEFAULT '',
      site_internet VARCHAR(255) NOT NULL DEFAULT '',
      commentaire_prive TEXT NOT NULL DEFAULT '',
      original_prospect_id VARCHAR(50),
      mandats JSONB NOT NULL DEFAULT '[]',
      agent_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts(last_name)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email_principal)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_contacts_agent_id ON contacts(agent_id)`);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS contacts`);
}
