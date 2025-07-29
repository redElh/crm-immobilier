import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
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