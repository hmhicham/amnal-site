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

async function addPrenomColumn() {
  try {
    const pool = await sql.connect(config);
    
    console.log('🔄 Ajout de la colonne prénom...');
    
    // Vérifier si la colonne existe déjà
    const checkColumn = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'utilisateurs' AND COLUMN_NAME = 'prenom'
    `);
    
    if (checkColumn.recordset.length === 0) {
      // Ajouter la colonne prénom
      await pool.request().query(`
        ALTER TABLE utilisateurs 
        ADD prenom NVARCHAR(100) NULL
      `);
      console.log('✅ Colonne prénom ajoutée');
      
      // Mettre à jour les utilisateurs existants avec des prénoms par défaut
      await pool.request().query(`
        UPDATE utilisateurs 
        SET prenom = CASE 
          WHEN nom LIKE '%IT 1%' THEN 'Mohamed'
          WHEN nom LIKE '%IT 2%' THEN 'Fatima'
          WHEN nom LIKE '%Comptabilité%' THEN 'Ahmed'
          WHEN nom LIKE '%RH%' THEN 'Aicha'
          ELSE 'Prénom'
        END
        WHERE prenom IS NULL
      `);
      console.log('✅ Prénoms par défaut ajoutés aux utilisateurs existants');
      
    } else {
      console.log('ℹ️ La colonne prénom existe déjà');
    }
    
    // Vérifier les utilisateurs mis à jour
    const result = await pool.request().query('SELECT nom, prenom, email, role FROM utilisateurs');
    console.log('\n👥 Utilisateurs avec prénom:');
    result.recordset.forEach(user => {
      console.log(`  - ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`);
    });
    
    await sql.close();
    console.log('\n✅ Mise à jour terminée!');
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

addPrenomColumn();
