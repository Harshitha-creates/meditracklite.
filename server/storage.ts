import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Database connection test
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ PostgreSQL database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    await testConnection();
    
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL REFERENCES users(id),
        doctor_id TEXT NOT NULL REFERENCES users(id),
        appointment_date TIMESTAMP NOT NULL,
        appointment_time VARCHAR(10) NOT NULL,
        health_concern TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        appointment_id TEXT NOT NULL REFERENCES appointments(id),
        patient_id TEXT NOT NULL REFERENCES users(id),
        doctor_id TEXT NOT NULL REFERENCES users(id),
        medicine_name VARCHAR(100) NOT NULL,
        dosage VARCHAR(100) NOT NULL,
        frequency VARCHAR(100) NOT NULL,
        duration VARCHAR(100),
        instructions TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        appointment_id TEXT NOT NULL REFERENCES appointments(id),
        patient_id TEXT NOT NULL REFERENCES users(id),
        doctor_id TEXT NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log('✓ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    return false;
  }
}

export { schema };