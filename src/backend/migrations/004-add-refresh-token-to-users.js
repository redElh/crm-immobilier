export async function up(pg) {
  await pg.query(`
    ALTER TABLE users
    ADD COLUMN refresh_token VARCHAR(255),
    ADD COLUMN refresh_token_expires TIMESTAMP
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
    DROP COLUMN refresh_token,
    DROP COLUMN refresh_token_expires
  `);
}
