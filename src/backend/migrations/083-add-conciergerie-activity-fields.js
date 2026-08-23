export async function up(pg) {
  await pg.query(`ALTER TABLE conciergerie_activities ADD COLUMN IF NOT EXISTS short_description VARCHAR(500)`);
  await pg.query(`ALTER TABLE conciergerie_activities ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)`);
  await pg.query(`ALTER TABLE conciergerie_activities ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)`);
  await pg.query(`ALTER TABLE conciergerie_activities ADD COLUMN IF NOT EXISTS included_items TEXT[]`);
  await pg.query(`ALTER TABLE conciergerie_activities ADD COLUMN IF NOT EXISTS not_included_items TEXT[]`);
  await pg.query(`ALTER TABLE conciergerie_activities ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'sur_demande'`);
  await pg.query(`ALTER TABLE conciergerie_activities ADD COLUMN IF NOT EXISTS photos TEXT[]`);
}

export async function down(pg) {
  await pg.query(`ALTER TABLE conciergerie_activities DROP COLUMN IF EXISTS short_description`);
  await pg.query(`ALTER TABLE conciergerie_activities DROP COLUMN IF EXISTS whatsapp`);
  await pg.query(`ALTER TABLE conciergerie_activities DROP COLUMN IF EXISTS contact_email`);
  await pg.query(`ALTER TABLE conciergerie_activities DROP COLUMN IF EXISTS included_items`);
  await pg.query(`ALTER TABLE conciergerie_activities DROP COLUMN IF EXISTS not_included_items`);
  await pg.query(`ALTER TABLE conciergerie_activities DROP COLUMN IF EXISTS availability`);
  await pg.query(`ALTER TABLE conciergerie_activities DROP COLUMN IF EXISTS photos`);
}
