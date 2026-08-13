import pool from '../config/db.js';

export async function up(pg) {
  await pg.query(`
    ALTER TABLE prospects ADD COLUMN IF NOT EXISTS original_prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_prospects_original_prospect_id ON prospects(original_prospect_id)
  `);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_prospects_original_prospect_id`);
  await pg.query(`ALTER TABLE prospects DROP COLUMN IF EXISTS original_prospect_id`);
}
