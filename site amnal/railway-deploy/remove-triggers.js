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

async function removeTriggers() {
  try {
    const pool = await sql.connect(config);
    
    console.log('🔄 Suppression de tous les triggers...');
    
    // Supprimer tous les triggers
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_update_date_modification')
        DROP TRIGGER trg_update_date_modification;
    `);
    
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_update_date_resolution')
        DROP TRIGGER trg_update_date_resolution;
    `);
    
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_create_notification_update')
        DROP TRIGGER trg_create_notification_update;
    `);
    
    console.log('✅ Tous les triggers supprimés');
    console.log('ℹ️ Les dates seront maintenant gérées directement dans le code de l\'application');
    
    await sql.close();
    console.log('✅ Suppression terminée!');
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

removeTriggers();
