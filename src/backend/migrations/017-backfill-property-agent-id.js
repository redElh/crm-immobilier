export async function up(pg) {
  await pg.query(`
    UPDATE properties
    SET agent_id = (
      SELECT CAST(id AS VARCHAR(50))
      FROM users
      WHERE role = 'agent'
      ORDER BY id
      LIMIT 1
    )
    WHERE (agent_id IS NULL OR agent_id = '')
      AND EXISTS (SELECT 1 FROM users WHERE role = 'agent')
  `);

  await pg.query(`
    UPDATE properties
    SET agent_id = (
      SELECT CAST(id AS VARCHAR(50))
      FROM users
      WHERE role = 'admin'
      ORDER BY id
      LIMIT 1
    )
    WHERE (agent_id IS NULL OR agent_id = '')
      AND EXISTS (SELECT 1 FROM users WHERE role = 'admin')
  `);
}

export async function down(pg) {
}
