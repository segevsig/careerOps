import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'careerops',
  user: process.env.DB_USER || 'careerops',
  password: process.env.DB_PASSWORD || 'careerops',
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
  // Do not exit: process.exit() kills the server and causes ERR_CONNECTION_RESET.
  // The pool may recover; let the app keep running.
});

// Initialize database tables
export const initDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_sessions table for tracking sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);

    // Create job_applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        position_title VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'applied',
        applied_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE job_applications
      ADD COLUMN IF NOT EXISTS applied_from VARCHAR(255) DEFAULT 'unknown'
    `);

    // Create cover_letter_jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cover_letter_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        job_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        job_description TEXT NOT NULL,
        cv_text TEXT NOT NULL,
        tone VARCHAR(50),
        cover_letter TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Create index on job_id for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cover_letter_jobs_job_id ON cover_letter_jobs(job_id)
    `);

    // Create index on user_id for user-specific queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cover_letter_jobs_user_id ON cover_letter_jobs(user_id)
    `);

    // Password reset tokens (token hashed, raw token sent by email)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool;

