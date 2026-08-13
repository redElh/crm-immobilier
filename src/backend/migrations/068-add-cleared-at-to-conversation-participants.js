export async function up(pg) {
  await pg.query(`
    ALTER TABLE conversation_participants
      ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMP
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE conversation_participants DROP COLUMN IF EXISTS cleared_at
  `);
}
