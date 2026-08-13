export async function up(pg) {
  await pg.query(`
    ALTER TABLE login_history
      ALTER COLUMN user_id DROP NOT NULL,
      ALTER COLUMN email DROP NOT NULL
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE login_history
      ALTER COLUMN user_id SET NOT NULL,
      ALTER COLUMN email SET NOT NULL
  `);
}
