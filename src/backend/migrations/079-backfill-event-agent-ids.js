export async function up(pg) {
  await pg.query(`
    UPDATE calendar_events
    SET agent_ids = jsonb_build_array(agent_id::text)
    WHERE agent_id IS NOT NULL
      AND (agent_ids IS NULL OR jsonb_array_length(agent_ids) = 0)
  `);
}

export async function down(pg) {}
