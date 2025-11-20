const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true }
};

async function checkUsers() {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT nom, email, role, password FROM utilisateurs');
    console.log('Utilisateurs dans la base:');
    result.recordset.forEach(user => {
      console.log(`- ${user.nom} (${user.email}) - ${user.role}`);
      console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
    });
    await sql.close();
  } catch (err) {
    console.error('Erreur:', err);
  }
}

checkUsers();
