export async function up(pg) {
  await pg.query(`ALTER TABLE client_activities ALTER COLUMN activity_date TYPE TIMESTAMPTZ USING activity_date AT TIME ZONE 'UTC'`);
  await pg.query(`ALTER TABLE client_activities ALTER COLUMN reminder_date TYPE TIMESTAMPTZ USING reminder_date AT TIME ZONE 'UTC'`);
}

export async function down(pg) {
  await pg.query(`ALTER TABLE client_activities ALTER COLUMN activity_date TYPE TIMESTAMP USING activity_date AT TIME ZONE 'UTC'`);
  await pg.query(`ALTER TABLE client_activities ALTER COLUMN reminder_date TYPE TIMESTAMP USING reminder_date AT TIME ZONE 'UTC'`);
}
