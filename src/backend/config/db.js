import pg from 'pg';
import dotenv from 'dotenv';
import { parse as parseConnectionString } from 'pg-connection-string';

dotenv.config();

const { Pool } = pg;

const normalizeHost = (host) => (!host || host === 'localhost' ? '127.0.0.1' : host);

let config = {
  user: process.env.DB_USER,
  host: normalizeHost(process.env.DB_HOST),
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

if (process.env.DATABASE_URL) {
  config = parseConnectionString(process.env.DATABASE_URL);
  config.host = normalizeHost(config.host);
  // Railway Postgres (and most hosted Postgres) require SSL.
  // Disable SSL only for localhost connections.
  if (!['127.0.0.1'].includes(config.host)) {
    config.ssl = { rejectUnauthorized: false };
  }
}

const pool = new Pool(config);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

// Test the database connection
try {
  const client = await pool.connect();
  console.log('Connected to PostgreSQL database');
  client.release();
} catch (error) {
  console.error('Database connection error:', error);
}

export default pool;