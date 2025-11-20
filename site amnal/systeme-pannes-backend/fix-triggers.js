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

async function fixTriggers() {
  try {
    const pool = await sql.connect(config);
    
    console.log('🔄 Correction des triggers...');
    
    // Supprimer les triggers problématiques
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
    
    console.log('✅ Triggers supprimés');
    
    // Recréer les triggers sans boucle infinie
    await pool.request().query(`
      CREATE TRIGGER trg_update_date_modification
      ON tickets
      AFTER UPDATE
      AS
      BEGIN
        SET NOCOUNT ON;
        
        -- Éviter la récursion
        IF UPDATE(date_modification)
          RETURN;
        
        UPDATE tickets 
        SET date_modification = GETDATE()
        FROM tickets t
        INNER JOIN inserted i ON t.id = i.id;
      END;
    `);
    
    await pool.request().query(`
      CREATE TRIGGER trg_update_date_resolution
      ON tickets
      AFTER UPDATE
      AS
      BEGIN
        SET NOCOUNT ON;
        
        -- Éviter la récursion
        IF UPDATE(date_resolution)
          RETURN;
        
        UPDATE tickets 
        SET date_resolution = GETDATE()
        FROM tickets t
        INNER JOIN inserted i ON t.id = i.id
        INNER JOIN deleted d ON t.id = d.id
        WHERE i.statut = 'resolu' AND d.statut != 'resolu';
      END;
    `);
    
    console.log('✅ Triggers recréés sans récursion');
    
    await sql.close();
    console.log('✅ Correction terminée!');
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

fixTriggers();
