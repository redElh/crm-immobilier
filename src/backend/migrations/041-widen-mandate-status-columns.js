import pool from '../config/db.js';

export async function up(pg) {
  await pg.query(`
    ALTER TABLE properties ALTER COLUMN mandate_status TYPE VARCHAR(50)
  `);
}

export async function down(pg) {
  await pg.query(`
    ALTER TABLE properties ALTER COLUMN mandate_status TYPE VARCHAR(20)
  `);
}
