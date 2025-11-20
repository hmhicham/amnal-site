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

async function updateRoleConstraint() {
  try {
    const pool = await sql.connect(config);
    
    console.log('🔄 Mise à jour de la contrainte des rôles...');
    
    // Supprimer l'ancienne contrainte
    await pool.request().query(`
      ALTER TABLE utilisateurs 
      DROP CONSTRAINT IF EXISTS CK__utilisate__role__398D8EEE
    `);
    
    // Ajouter la nouvelle contrainte avec seulement 'user' et 'technicien'
    await pool.request().query(`
      ALTER TABLE utilisateurs 
      ADD CONSTRAINT CK_utilisateurs_role 
      CHECK (role IN ('user', 'technicien'))
    `);
    
    console.log('✅ Contrainte mise à jour: seuls "user" et "technicien" sont autorisés');
    
    await sql.close();
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

updateRoleConstraint();
