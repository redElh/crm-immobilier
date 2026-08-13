export async function up(pg) {
  await pg.query(`
    ALTER TABLE users
    ADD COLUMN profile_image VARCHAR(500)
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
    DROP COLUMN profile_image
  `);
}
