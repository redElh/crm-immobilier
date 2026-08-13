export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      client_name VARCHAR(255) DEFAULT '',
      first_name VARCHAR(150) DEFAULT '',
      last_name VARCHAR(150) DEFAULT '',
      email VARCHAR(255) DEFAULT '',
      phone VARCHAR(50) DEFAULT '',
      languages TEXT[] DEFAULT '{}',
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      nights INTEGER DEFAULT 0,
      adults INTEGER DEFAULT 1,
      children INTEGER DEFAULT 0,
      babies INTEGER DEFAULT 0,
      price_per_night NUMERIC(12,2) DEFAULT 0,
      total_price NUMERIC(12,2) DEFAULT 0,
      options_price NUMERIC(12,2) DEFAULT 0,
      grand_total NUMERIC(12,2) DEFAULT 0,
      deposit_paid NUMERIC(12,2) DEFAULT 0,
      balance_due NUMERIC(12,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'option',
      options JSONB DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_reservations_start_date ON reservations(start_date)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_reservations_status`);
  await pg.query(`DROP INDEX IF EXISTS idx_reservations_start_date`);
  await pg.query(`DROP INDEX IF EXISTS idx_reservations_property_id`);
  await pg.query(`DROP TABLE IF EXISTS reservations`);
}
