export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS conciergerie_pricing_tiers (
      id SERIAL PRIMARY KEY,
      activity_id INTEGER NOT NULL REFERENCES conciergerie_activities(id) ON DELETE CASCADE,
      min_persons INTEGER NOT NULL DEFAULT 1,
      max_persons INTEGER NOT NULL DEFAULT 12,
      price_per_person NUMERIC(10,2) NOT NULL,
      commission_rate NUMERIC(5,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_pricing_tiers_activity ON conciergerie_pricing_tiers(activity_id)
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS conciergerie_pricing_tiers`);
}
