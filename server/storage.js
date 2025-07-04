const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { createId } = require('@paralleldrive/cuid2');
require('dotenv').config(); // Ensure .env is loaded

// Create PostgreSQL connection pool with forced SSL (Neon requires it)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Drizzle ORM
const db = drizzle(pool);

// Database connection test
async function testConnection() {
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
async function initializeDatabase() {
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

// Helper function to generate ID
function generateId() {
  return createId();
}

// Database helper functions
const dbHelpers = {
  async createUser(userData) {
    const id = generateId();
    const query = `
      INSERT INTO users (id, name, email, password, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [id, userData.name, userData.email, userData.password, userData.role]);
    return result.rows[0];
  },

  async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  async findUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async getAllDoctors() {
    const query = 'SELECT * FROM users WHERE role = $1 ORDER BY name';
    const result = await pool.query(query, ['Doctor']);
    return result.rows;
  },

  async createAppointment(appointmentData) {
    const id = generateId();
    const query = `
      INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, health_concern, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      id,
      appointmentData.patientId,
      appointmentData.doctorId,
      appointmentData.appointmentDate,
      appointmentData.appointmentTime,
      appointmentData.healthConcern,
      appointmentData.status || 'Pending'
    ]);
    return result.rows[0];
  },

  async getAppointmentsByPatient(patientId) {
    const query = `
      SELECT a.*, u.name as doctor_name 
      FROM appointments a 
      JOIN users u ON a.doctor_id = u.id 
      WHERE a.patient_id = $1 
      ORDER BY a.appointment_date DESC
    `;
    const result = await pool.query(query, [patientId]);
    return result.rows;
  },

  async getAppointmentsByDoctor(doctorId) {
    const query = `
      SELECT a.*, u.name as patient_name 
      FROM appointments a 
      JOIN users u ON a.patient_id = u.id 
      WHERE a.doctor_id = $1 
      ORDER BY a.appointment_date DESC
    `;
    const result = await pool.query(query, [doctorId]);
    return result.rows;
  },

  async getAllAppointments() {
    const query = `
      SELECT a.*, 
             p.name as patient_name,
             d.name as doctor_name
      FROM appointments a 
      JOIN users p ON a.patient_id = p.id 
      JOIN users d ON a.doctor_id = d.id 
      ORDER BY a.appointment_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getAppointmentById(id) {
    const query = `
      SELECT a.*, 
             p.name as patient_name, p.email as patient_email,
             d.name as doctor_name, d.email as doctor_email
      FROM appointments a 
      JOIN users p ON a.patient_id = p.id 
      JOIN users d ON a.doctor_id = d.id 
      WHERE a.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async updateAppointmentStatus(id, status) {
    const query = 'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  },

  async createPrescription(prescriptionData) {
    const id = generateId();
    const query = `
      INSERT INTO prescriptions (id, appointment_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration, instructions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      id,
      prescriptionData.appointmentId,
      prescriptionData.patientId,
      prescriptionData.doctorId,
      prescriptionData.medicineName,
      prescriptionData.dosage,
      prescriptionData.frequency,
      prescriptionData.duration,
      prescriptionData.instructions
    ]);
    return result.rows[0];
  },

  async getPrescriptionsByPatient(patientId) {
    const query = `
      SELECT p.*, a.appointment_date, d.name as doctor_name
      FROM prescriptions p
      JOIN appointments a ON p.appointment_id = a.id
      JOIN users d ON p.doctor_id = d.id
      WHERE p.patient_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [patientId]);
    return result.rows;
  },

  async getPrescriptionsByDoctor(doctorId) {
    const query = `
      SELECT p.*, a.appointment_date, u.name as patient_name
      FROM prescriptions p
      JOIN appointments a ON p.appointment_id = a.id
      JOIN users u ON p.patient_id = u.id
      WHERE p.doctor_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [doctorId]);
    return result.rows;
  },

  async createFeedback(feedbackData) {
    const id = generateId();
    const query = `
      INSERT INTO feedback (id, appointment_id, patient_id, doctor_id, rating, comments)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      id,
      feedbackData.appointmentId,
      feedbackData.patientId,
      feedbackData.doctorId,
      feedbackData.rating,
      feedbackData.comments
    ]);
    return result.rows[0];
  },

  async getFeedbackByDoctor(doctorId) {
    const query = `
      SELECT f.*, a.appointment_date, u.name as patient_name
      FROM feedback f
      JOIN appointments a ON f.appointment_id = a.id
      JOIN users u ON f.patient_id = u.id
      WHERE f.doctor_id = $1
      ORDER BY f.created_at DESC
    `;
    const result = await pool.query(query, [doctorId]);
    return result.rows;
  }
};

module.exports = {
  db,
  pool,
  testConnection,
  initializeDatabase,
  ...dbHelpers
};
