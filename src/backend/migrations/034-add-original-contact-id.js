import pool from '../config/db.js';

export async function up(pg) {
  await pg.query(`
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS original_contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_contacts_original_contact_id ON contacts(original_contact_id)
  `);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_contacts_original_contact_id`);
  await pg.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS original_contact_id`);
}
