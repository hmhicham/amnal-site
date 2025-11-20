const sql = require('mssql');
const bcrypt = require('bcrypt');
require('dotenv').config();

const config = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true }
};

async function fixPasswords() {
  try {
    // Générer le hash correct pour 'admin123'
    const correctHash = await bcrypt.hash('admin123', 10);
    console.log('Hash généré pour admin123:', correctHash);
    
    // Mettre à jour tous les utilisateurs avec le bon hash
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('password', sql.NVarChar, correctHash);
    
    const result = await request.query(`
      UPDATE utilisateurs 
      SET password = @password 
      WHERE email IN ('admin@amnal.dz', 'technicien@amnal.dz', 'user@amnal.dz')
    `);
    
    console.log('Mots de passe mis à jour pour tous les utilisateurs de test');
    console.log('Mot de passe: admin123');
    
    // Vérifier la mise à jour
    const checkResult = await sql.query('SELECT nom, email FROM utilisateurs');
    console.log('\nUtilisateurs mis à jour:');
    checkResult.recordset.forEach(user => {
      console.log(`- ${user.nom} (${user.email}) - Mot de passe: admin123`);
    });
    
    await sql.close();
    console.log('\n✅ Mise à jour terminée!');
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

fixPasswords();
