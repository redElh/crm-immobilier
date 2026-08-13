export async function up(pg) {
  await pg.query(`
    ALTER TABLE users
    ADD COLUMN reset_token VARCHAR(255),
    ADD COLUMN reset_token_expires TIMESTAMP
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
    DROP COLUMN reset_token,
    DROP COLUMN reset_token_expires
  `);
}
