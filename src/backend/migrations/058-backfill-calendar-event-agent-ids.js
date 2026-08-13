export async function up(pg) {
  await pg.query(`
    UPDATE calendar_events
    SET agent_ids = jsonb_build_array(agent_id::text)
    WHERE agent_id IS NOT NULL
      AND (
        agent_ids IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(agent_ids) AS el
          WHERE el ~ '^[0-9]+$'
        )
      )
  `);
}

export async function down(pg) {
  // No-op: cannot reliably reverse a data backfill
}
