const { Pool } = require('pg');
const winston = require('winston');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    winston.error('Error connecting to the database:', err);
    return;
  }
  winston.info('Successfully connected to the database');
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}; 