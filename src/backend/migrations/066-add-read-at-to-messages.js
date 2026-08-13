export async function up(pg) {
  await pg.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ
  `);

  // Backfill: give each already-read message its own read time (the moment the
  // last non-sender participant read it), so older messages are consistent with
  // the per-message read timestamps recorded from now on.
  await pg.query(`
    UPDATE messages m
    SET read_at = sub.read_time
    FROM (
      SELECT m2.id,
             MAX(cp.last_read_at) AS read_time
      FROM messages m2
      JOIN conversation_participants cp
        ON cp.conversation_id = m2.conversation_id
       AND cp.user_id <> m2.sender_id
      GROUP BY m2.id
      HAVING BOOL_AND(cp.last_read_at IS NOT NULL AND cp.last_read_at >= m2.created_at)
    ) sub
    WHERE m.id = sub.id
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE messages DROP COLUMN IF EXISTS read_at
  `);
}
