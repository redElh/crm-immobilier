export async function up(pg) {
  await pg.query(`
    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMP
  `);
}

export async function down(pg) {
  await pg.query(`ALTER TABLE notifications DROP COLUMN IF EXISTS read_at`);
}
