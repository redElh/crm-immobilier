export async function up(pg) {
  await pg.query(`
    ALTER TABLE users 
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
    DROP COLUMN is_active
  `);
}