export async function up(pg) {
  await pg.query(`ALTER TABLE google_calendar_tokens ADD COLUMN IF NOT EXISTS sync_token TEXT`);
}

export async function down(pg) {
  await pg.query(`ALTER TABLE google_calendar_tokens DROP COLUMN IF EXISTS sync_token`);
}
