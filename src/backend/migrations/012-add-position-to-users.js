export async function up(pg) {
  await pg.query(`
    ALTER TABLE users
    ADD COLUMN position VARCHAR(100) DEFAULT 'Agent immobilier'
  `);
  await pg.query(`
    UPDATE users SET position = 'Admin' WHERE role = 'admin' AND (position IS NULL OR position = 'Agent immobilier')
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
    DROP COLUMN position
  `);
}
