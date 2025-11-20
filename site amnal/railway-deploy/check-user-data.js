const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT id, nom, email, role, departement FROM utilisateurs ORDER BY id');
    
    console.log('\n📊 All users in database:\n');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  Nom: ${user.nom}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Departement: ${user.departement || '(NULL)'}`);
      console.log('---');
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
