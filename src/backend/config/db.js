import pg from 'pg';
import dotenv from 'dotenv';
import { parse as parseConnectionString } from 'pg-connection-string';

dotenv.config();

const { Pool } = pg;

let config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

if (process.env.DATABASE_URL) {
  config = parseConnectionString(process.env.DATABASE_URL);
  // Railway Postgres (and most hosted Postgres) require SSL.
  // Disable SSL only for localhost connections.
  const host = config.host || 'localhost';
  if (!['localhost', '127.0.0.1'].includes(host)) {
    config.ssl = { rejectUnauthorized: false };
  }
}

const pool = new Pool(config);

// Test the database connection
try {
  const client = await pool.connect();
  console.log('Connected to PostgreSQL database');
  client.release();
} catch (error) {
  console.error('Database connection error:', error);
}

export default pool;