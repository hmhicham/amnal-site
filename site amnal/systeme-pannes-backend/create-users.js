const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function createUsers() {
  try {
    // Hash the password 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Hashed password created for: admin123\n');

    // Delete existing users if any
    await pool.query('DELETE FROM utilisateurs');
    console.log('✅ Cleared existing users\n');

    // Create admin user
    const adminResult = await pool.query(
      `INSERT INTO utilisateurs (nom, email, password, role, departement) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nom, email, role`,
      ['Administrateur', 'admin@amnal.dz', hashedPassword, 'admin', 'IT']
    );
    console.log('✅ Admin created:', adminResult.rows[0]);

    // Create technicien user
    const techResult = await pool.query(
      `INSERT INTO utilisateurs (nom, email, password, role, departement) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nom, email, role`,
      ['Technicien Test', 'technicien@amnal.dz', hashedPassword, 'technicien', 'IT']
    );
    console.log('✅ Technicien created:', techResult.rows[0]);

    // Create a regular user
    const userResult = await pool.query(
      `INSERT INTO utilisateurs (nom, email, password, role, departement) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nom, email, role`,
      ['Utilisateur Test', 'user@amnal.dz', hashedPassword, 'user', 'Comptabilité']
    );
    console.log('✅ User created:', userResult.rows[0]);

    console.log('\n🎉 All users created successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin@amnal.dz / admin123');
    console.log('  Technicien: technicien@amnal.dz / admin123');
    console.log('  User: user@amnal.dz / admin123');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsers();
