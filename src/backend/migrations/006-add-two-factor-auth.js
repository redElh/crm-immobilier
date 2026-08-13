export async function up(pg) {
  await pg.query(`
    ALTER TABLE users
    ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
    ADD COLUMN two_factor_secret VARCHAR(255),
    ADD COLUMN backup_codes TEXT[] DEFAULT '{}',
    ADD COLUMN two_factor_setup_date TIMESTAMP,
    ADD COLUMN failed_2fa_attempts INTEGER DEFAULT 0,
    ADD COLUMN locked_until TIMESTAMP
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE users
    DROP COLUMN two_factor_enabled,
    DROP COLUMN two_factor_secret,
    DROP COLUMN backup_codes,
    DROP COLUMN two_factor_setup_date,
    DROP COLUMN failed_2fa_attempts,
    DROP COLUMN locked_until
  `);
}
