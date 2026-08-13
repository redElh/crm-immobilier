export const USER_COLOR_PALETTE = [
  '#4F46E5', '#2563EB', '#059669', '#0891B2', '#D97706', '#DC2626',
  '#7C3AED', '#0F766E', '#DB2777', '#EA580C', '#65A30D', '#0E7490',
];

export async function getNextAvailableUserColor(pg) {
  const { rows } = await pg.query('SELECT color FROM users WHERE color IS NOT NULL');
  const used = new Set(rows.map(r => r.color));
  return USER_COLOR_PALETTE.find(c => !used.has(c)) || USER_COLOR_PALETTE[0];
}
