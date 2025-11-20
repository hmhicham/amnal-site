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

async function updateUsers() {
  try {
    const pool = await sql.connect(config);
    
    console.log('🔄 Mise à jour des utilisateurs...');
    
    // Supprimer l'ancien admin et le remplacer par des techniciens et users
    await pool.request().query('DELETE FROM utilisateurs');
    
    // Créer 2 techniciens et 2 utilisateurs normaux
    const request = pool.request();
    
    // Techniciens
    await request.query(`
      INSERT INTO utilisateurs (nom, email, password, role, departement) VALUES
      ('Technicien IT 1', 'tech1@amnal.dz', '$2b$10$aO3.nlnsHnEuUv6MK3I8u.yzsW0BglCQZhSi8z7rqEq10H1HAomsu', 'technicien', 'Service IT'),
      ('Technicien IT 2', 'tech2@amnal.dz', '$2b$10$aO3.nlnsHnEuUv6MK3I8u.yzsW0BglCQZhSi8z7rqEq10H1HAomsu', 'technicien', 'Service IT')
    `);
    
    // Utilisateurs normaux
    await request.query(`
      INSERT INTO utilisateurs (nom, email, password, role, departement) VALUES
      ('Employé Comptabilité', 'user1@amnal.dz', '$2b$10$aO3.nlnsHnEuUv6MK3I8u.yzsW0BglCQZhSi8z7rqEq10H1HAomsu', 'user', 'Comptabilité'),
      ('Employé RH', 'user2@amnal.dz', '$2b$10$aO3.nlnsHnEuUv6MK3I8u.yzsW0BglCQZhSi8z7rqEq10H1HAomsu', 'user', 'Ressources Humaines')
    `);
    
    // Vérifier les utilisateurs créés
    const result = await pool.request().query('SELECT nom, email, role, departement FROM utilisateurs ORDER BY role, nom');
    
    console.log('\n✅ Utilisateurs mis à jour:');
    console.log('\n👨‍🔧 TECHNICIENS (peuvent gérer les tickets):');
    result.recordset.filter(u => u.role === 'technicien').forEach(user => {
      console.log(`  - ${user.nom} (${user.email}) - ${user.departement}`);
    });
    
    console.log('\n👤 UTILISATEURS (peuvent créer des tickets):');
    result.recordset.filter(u => u.role === 'user').forEach(user => {
      console.log(`  - ${user.nom} (${user.email}) - ${user.departement}`);
    });
    
    console.log('\n🔑 Mot de passe pour tous: admin123');
    
    await sql.close();
    console.log('\n✅ Mise à jour terminée!');
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

updateUsers();
