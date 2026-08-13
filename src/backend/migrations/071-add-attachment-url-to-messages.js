export async function up(pg) {
  await pg.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS attachment_url TEXT
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE messages DROP COLUMN IF EXISTS attachment_url
  `);
}
