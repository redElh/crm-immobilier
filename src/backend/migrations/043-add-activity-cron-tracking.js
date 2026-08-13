export async function up(pg) {
  await pg.query(`ALTER TABLE client_activities ADD COLUMN IF NOT EXISTS alarm_sent BOOLEAN DEFAULT FALSE`);
  await pg.query(`ALTER TABLE client_activities ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE`);
  await pg.query(`ALTER TABLE client_activities ADD COLUMN IF NOT EXISTS author_role VARCHAR(20) DEFAULT ''`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_client_activities_alarm ON client_activities(activity_date) WHERE alarm_sent = FALSE`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_client_activities_reminder ON client_activities(reminder_date) WHERE reminder_sent = FALSE AND has_reminder = TRUE`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_client_activities_reminder`);
  await pg.query(`DROP INDEX IF EXISTS idx_client_activities_alarm`);
  await pg.query(`ALTER TABLE client_activities DROP COLUMN IF EXISTS author_role`);
  await pg.query(`ALTER TABLE client_activities DROP COLUMN IF EXISTS reminder_sent`);
  await pg.query(`ALTER TABLE client_activities DROP COLUMN IF EXISTS alarm_sent`);
}
