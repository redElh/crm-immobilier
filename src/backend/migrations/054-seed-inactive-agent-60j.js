import bcrypt from 'bcrypt';

export async function up(pg) {
  const email = 'paul.testinactif60j@squaremeter.ma';

  const existing = await pg.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) return;

  const hashedPassword = await bcrypt.hash('password123', 10);

  const sixtyFiveDaysAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  await pg.query(
    `INSERT INTO users (first_name, last_name, email, password, role, status, is_active, last_login_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    ['Paul', 'TestInactif60j', email, hashedPassword, 'agent', 'inactif', false, sixtyFiveDaysAgo, ninetyDaysAgo, ninetyDaysAgo]
  );
}

export async function down(pg) {
  await pg.query("DELETE FROM users WHERE email = 'paul.testinactif60j@squaremeter.ma'");
}
