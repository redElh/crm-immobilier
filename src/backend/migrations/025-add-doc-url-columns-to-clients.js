export async function up(pg) {
  await pg.query(`
    ALTER TABLE owner_clients
      ADD COLUMN IF NOT EXISTS mandat_pdf_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS mandat_pdf_name TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_identite_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_identite_name TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_domicile_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_domicile_name TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_revenus_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_revenus_name TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_financement_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_financement_name TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_bancaire_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS doc_bancaire_name TEXT NOT NULL DEFAULT ''
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE owner_clients
      DROP COLUMN IF EXISTS mandat_pdf_url,
      DROP COLUMN IF EXISTS mandat_pdf_name,
      DROP COLUMN IF EXISTS doc_identite_url,
      DROP COLUMN IF EXISTS doc_identite_name,
      DROP COLUMN IF EXISTS doc_domicile_url,
      DROP COLUMN IF EXISTS doc_domicile_name,
      DROP COLUMN IF EXISTS doc_revenus_url,
      DROP COLUMN IF EXISTS doc_revenus_name,
      DROP COLUMN IF EXISTS doc_financement_url,
      DROP COLUMN IF EXISTS doc_financement_name,
      DROP COLUMN IF EXISTS doc_bancaire_url,
      DROP COLUMN IF EXISTS doc_bancaire_name
  `);
}
