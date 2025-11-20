const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: 'postgres', // Connect to default database first
});

async function testConnection() {
  try {
    console.log('Testing connection with:');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('Port:', process.env.DB_PORT || 5432);
    console.log('User:', process.env.DB_USER || 'postgres');
    console.log('Password:', process.env.DB_PASSWORD ? '***' : '(empty)');
    
    const result = await pool.query('SELECT version()');
    console.log('\n✅ Connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Check if database exists
    const dbCheck = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'systeme_pannes_it']
    );
    
    if (dbCheck.rows.length > 0) {
      console.log(`✅ Database '${process.env.DB_NAME}' exists`);
    } else {
      console.log(`❌ Database '${process.env.DB_NAME}' does NOT exist`);
      console.log('\nTo create it, run:');
      console.log(`CREATE DATABASE ${process.env.DB_NAME} WITH ENCODING 'UTF8';`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

testConnection();
