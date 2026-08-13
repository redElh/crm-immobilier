export async function up(pg) {
  await pg.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE messages DROP COLUMN IF EXISTS deleted_at
  `);
}
