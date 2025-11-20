const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Tables in database '${process.env.DB_NAME}':\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No tables found! You need to run the SQL schema.');
      console.log('\nRun this command:');
      console.log('psql -U postgres -d systeme_pannes_it -f database_schema_postgres.sql');
    } else {
      result.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
      
      // Check for users
      const users = await pool.query('SELECT COUNT(*) as count FROM utilisateurs');
      console.log(`\n👥 Users in database: ${users.rows[0].count}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
