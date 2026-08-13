const USER_COLOR_PALETTE = [
  '#4F46E5', '#2563EB', '#059669', '#0891B2', '#D97706', '#DC2626',
  '#7C3AED', '#0F766E', '#DB2777', '#EA580C', '#65A30D', '#0E7490',
];

export async function up(pg) {
  await pg.query('ALTER TABLE users ADD COLUMN color VARCHAR(7)');

  const { rows } = await pg.query(
    `SELECT id FROM users WHERE role IN ('agent', 'admin', 'gerant') AND status != 'supprimé' ORDER BY id`
  );
  for (let i = 0; i < rows.length; i++) {
    await pg.query('UPDATE users SET color = $1 WHERE id = $2', [
      USER_COLOR_PALETTE[i % USER_COLOR_PALETTE.length],
      rows[i].id,
    ]);
  }

  const { rows: remaining } = await pg.query(
    `SELECT id FROM users WHERE color IS NULL AND status != 'supprimé' ORDER BY id`
  );
  for (let i = 0; i < remaining.length; i++) {
    await pg.query('UPDATE users SET color = $1 WHERE id = $2', [
      USER_COLOR_PALETTE[i % USER_COLOR_PALETTE.length],
      remaining[i].id,
    ]);
  }
}

export async function down(pg) {
  await pg.query('ALTER TABLE users DROP COLUMN color');
}
