export async function up(pg) {
  await pg.query(`
    ALTER TABLE automators
    ADD COLUMN IF NOT EXISTS delegated_by VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS delegated_to VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS delegation_type VARCHAR(50) NOT NULL DEFAULT ''
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE automators
    DROP COLUMN IF EXISTS delegated_by,
    DROP COLUMN IF EXISTS delegated_to,
    DROP COLUMN IF EXISTS delegation_type
  `);
}
