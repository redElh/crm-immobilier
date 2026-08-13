import bcrypt from 'bcrypt';

export async function up(pg) {
  const email = 'marie.testinactive@squaremeter.ma';

  const existing = await pg.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) return;

  const hashedPassword = await bcrypt.hash('password123', 10);

  const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  await pg.query(
    `INSERT INTO users (first_name, last_name, email, password, role, status, is_active, last_login_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    ['Marie', 'TestInactive', email, hashedPassword, 'agent', 'inactif', false, thirtyFiveDaysAgo, sixtyDaysAgo, sixtyDaysAgo]
  );
}

export async function down(pg) {
  await pg.query("DELETE FROM users WHERE email = 'marie.testinactive@squaremeter.ma'");
}
