export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS automators (
      id SERIAL PRIMARY KEY,
      modele_id INTEGER NOT NULL DEFAULT 0,
      event_id VARCHAR(100),
      niveau VARCHAR(50) NOT NULL DEFAULT 'utilisateur',
      niveau_label VARCHAR(100) NOT NULL DEFAULT '',
      nom_personnalise VARCHAR(255),
      created_by VARCHAR(100) NOT NULL DEFAULT '',
      actif BOOLEAN NOT NULL DEFAULT true,
      frequence VARCHAR(100) NOT NULL DEFAULT '',
      derniere_execution TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pg.query(`
    CREATE TABLE IF NOT EXISTS automator_notifications (
      id SERIAL PRIMARY KEY,
      automator_id INTEGER NOT NULL REFERENCES automators(id) ON DELETE CASCADE,
      canal VARCHAR(50) NOT NULL DEFAULT 'email',
      actif BOOLEAN NOT NULL DEFAULT true,
      langue VARCHAR(10) NOT NULL DEFAULT 'fr',
      objet_template TEXT,
      message_template TEXT NOT NULL DEFAULT '',
      destinataires TEXT[] NOT NULL DEFAULT '{}'
    )
  `);

  await pg.query(`
    CREATE TABLE IF NOT EXISTS automator_logs (
      id SERIAL PRIMARY KEY,
      automator_id INTEGER NOT NULL DEFAULT 0,
      evenement VARCHAR(255) NOT NULL DEFAULT '',
      destinataire VARCHAR(255) NOT NULL DEFAULT '',
      statut VARCHAR(50) NOT NULL DEFAULT 'en_attente',
      message_erreur TEXT,
      execute_le TIMESTAMP NOT NULL DEFAULT NOW(),
      contenu TEXT
    )
  `);

  await pg.query(`
    CREATE TABLE IF NOT EXISTS automator_triggered_notifications (
      id SERIAL PRIMARY KEY,
      event_id VARCHAR(100) NOT NULL DEFAULT '',
      event_label VARCHAR(255) NOT NULL DEFAULT '',
      categorie VARCHAR(100) NOT NULL DEFAULT '',
      canal VARCHAR(20) NOT NULL DEFAULT 'crm',
      titre VARCHAR(255) NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      email_html TEXT,
      crm_html TEXT,
      read_at TIMESTAMP,
      agent_nom VARCHAR(255) NOT NULL DEFAULT '',
      bien_titre VARCHAR(255) NOT NULL DEFAULT '',
      client_nom VARCHAR(255) NOT NULL DEFAULT '',
      client_type VARCHAR(100) NOT NULL DEFAULT '',
      mandat_type VARCHAR(100) NOT NULL DEFAULT '',
      date_expiration VARCHAR(50) NOT NULL DEFAULT '',
      date_triggered TIMESTAMP NOT NULL DEFAULT NOW(),
      read BOOLEAN NOT NULL DEFAULT false
    )
  `);

  await pg.query(`CREATE INDEX IF NOT EXISTS idx_automator_notifications_automator_id ON automator_notifications(automator_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_automator_logs_automator_id ON automator_logs(automator_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_automator_triggered_notifications_read ON automator_triggered_notifications(read)`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_automator_triggered_notifications_read`);
  await pg.query(`DROP INDEX IF EXISTS idx_automator_logs_automator_id`);
  await pg.query(`DROP INDEX IF EXISTS idx_automator_notifications_automator_id`);
  await pg.query(`DROP TABLE IF EXISTS automator_triggered_notifications`);
  await pg.query(`DROP TABLE IF EXISTS automator_logs`);
  await pg.query(`DROP TABLE IF EXISTS automator_notifications`);
  await pg.query(`DROP TABLE IF EXISTS automators`);
}
