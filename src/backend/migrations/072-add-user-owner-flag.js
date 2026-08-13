export async function up(pg) {
  await pg.query(`
    ALTER TABLE users
    ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT false
  `);
  await pg.query(`
    UPDATE users SET is_owner = true
    WHERE id = (
      SELECT id FROM users WHERE role = 'admin' AND status != 'supprimé'
      ORDER BY created_at ASC LIMIT 1
    )
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
    DROP COLUMN is_owner
  `);
}
