export async function up(pg) {
  await pg.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS audio_url VARCHAR(512)
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE messages DROP COLUMN IF EXISTS audio_url
  `);
}
