// Add documents storage + history trail for contracts.
// - contracts.documents: jsonb array of uploaded files
// - contract_history: audit trail (creation, status changes, notes, documents)
export async function up(pg) {
  await pg.query(`
    ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb
  `);

  await pg.query(`
    CREATE TABLE IF NOT EXISTS contract_history (
      id SERIAL PRIMARY KEY,
      contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      agent_name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_contract_history_contract_id
    ON contract_history (contract_id, created_at DESC)
  `);

  // Backfill a "Contrat créé" entry for contracts that have none yet
  await pg.query(`
    INSERT INTO contract_history (contract_id, action, details, agent_name, created_at)
    SELECT c.id, 'Contrat créé',
      'Contrat ' || COALESCE(NULLIF(c.reference, ''), '#' || c.id) || ' créé',
      COALESCE(NULLIF(c.agent_name, ''), 'Système'),
      COALESCE(c.created_at, NOW())
    FROM contracts c
    WHERE NOT EXISTS (
      SELECT 1 FROM contract_history h WHERE h.contract_id = c.id
    )
  `);
}

export async function down(pg) {
  await pg.query('DROP TABLE IF EXISTS contract_history');
  await pg.query('ALTER TABLE contracts DROP COLUMN IF EXISTS documents');
}
