export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS conciergerie_partners (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      contact_name VARCHAR(200),
      phone VARCHAR(30),
      email VARCHAR(255),
      address TEXT,
      commission_rate NUMERIC(5,2) DEFAULT 10,
      contract_status VARCHAR(30) DEFAULT 'en_cours',
      notes TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query(`
    CREATE TABLE IF NOT EXISTS conciergerie_activities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100) NOT NULL,
      partner_id INTEGER REFERENCES conciergerie_partners(id) ON DELETE SET NULL,
      duration_hours NUMERIC(5,1),
      min_capacity INTEGER DEFAULT 1,
      max_capacity INTEGER DEFAULT 12,
      price NUMERIC(10,2) NOT NULL,
      commission_rate NUMERIC(5,2) DEFAULT 10,
      description TEXT,
      photo_url VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query(`
    CREATE TABLE IF NOT EXISTS conciergerie_reservations (
      id SERIAL PRIMARY KEY,
      activity_id INTEGER NOT NULL REFERENCES conciergerie_activities(id) ON DELETE CASCADE,
      client_id INTEGER,
      client_name VARCHAR(200) NOT NULL,
      client_email VARCHAR(255),
      client_phone VARCHAR(30),
      reservation_date DATE NOT NULL,
      participants INTEGER DEFAULT 1,
      total_price NUMERIC(10,2) NOT NULL,
      commission_amount NUMERIC(10,2) DEFAULT 0,
      status VARCHAR(30) DEFAULT 'en_attente',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function down(pg) {
  await pg.query(`DROP TABLE IF EXISTS conciergerie_reservations`);
  await pg.query(`DROP TABLE IF EXISTS conciergerie_activities`);
  await pg.query(`DROP TABLE IF EXISTS conciergerie_partners`);
}
