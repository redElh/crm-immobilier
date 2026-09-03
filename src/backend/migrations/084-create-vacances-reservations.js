export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS vacances_reservations (
      id SERIAL PRIMARY KEY,
      apimo_property_id VARCHAR(64) NOT NULL,
      reserved_date DATE NOT NULL,
      note TEXT DEFAULT '',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(apimo_property_id, reserved_date)
    )
  `);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_vacances_res_apimo ON vacances_reservations(apimo_property_id)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS idx_vacances_res_date ON vacances_reservations(reserved_date)`);
}

export async function down(pg) {
  await pg.query(`DROP INDEX IF EXISTS idx_vacances_res_date`);
  await pg.query(`DROP INDEX IF EXISTS idx_vacances_res_apimo`);
  await pg.query(`DROP TABLE IF EXISTS vacances_reservations`);
}
