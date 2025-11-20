// test-sqlserver-connection.js
// Script pour tester la connexion à SQL Server

require('dotenv').config();
const sql = require('mssql');

const config = {
    server: process.env.DB_HOST || '192.168.148.131',
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME || 'systeme_pannes_it',
    options: {
        encrypt: false, // Pour serveur local
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Ajouter l'authentification seulement si user/password sont fournis
if (process.env.DB_USER && process.env.DB_PASSWORD) {
    config.user = process.env.DB_USER;
    config.password = process.env.DB_PASSWORD;
} else {
    // Utiliser l'authentification Windows
    config.options.trustedConnection = true;
}

async function testConnection() {
    console.log('🔄 Test de connexion SQL Server...');
    console.log(`📍 Serveur: ${config.server}:${config.port}`);
    console.log(`🗄️ Base de données: ${config.database}`);
    if (config.user) {
        console.log(`👤 Utilisateur: ${config.user}`);
    } else {
        console.log('👤 Authentification Windows');
    }
    console.log('');

    try {
        // Test de connexion
        console.log('1️⃣ Connexion au serveur SQL Server...');
        const pool = await sql.connect(config);
        console.log('✅ Connexion réussie!');

        // Test de requête simple
        console.log('2️⃣ Test de requête simple...');
        const versionResult = await pool.request().query('SELECT @@VERSION as version');
        console.log('✅ Version SQL Server:', versionResult.recordset[0].version.split('\n')[0]);

        // Vérifier les tables
        console.log('3️⃣ Vérification des tables...');
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        
        if (tablesResult.recordset.length > 0) {
            console.log('✅ Tables trouvées:');
            tablesResult.recordset.forEach(table => {
                console.log(`   - ${table.TABLE_NAME}`);
            });
        } else {
            console.log('⚠️ Aucune table trouvée. Exécutez le script database_schema_sqlserver.sql');
        }

        // Test des utilisateurs
        console.log('4️⃣ Vérification des utilisateurs...');
        const usersResult = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM utilisateurs
        `);
        console.log(`✅ Nombre d'utilisateurs: ${usersResult.recordset[0].count}`);

        // Test d'insertion simple
        console.log('5️⃣ Test d\'insertion/suppression...');
        const testInsert = await pool.request()
            .input('nom', sql.NVarChar, 'Test User')
            .input('email', sql.NVarChar, 'test@example.com')
            .input('password', sql.NVarChar, 'test123')
            .query(`
                INSERT INTO utilisateurs (nom, email, password) 
                OUTPUT INSERTED.id
                VALUES (@nom, @email, @password)
            `);
        
        const testId = testInsert.recordset[0].id;
        console.log(`✅ Utilisateur test créé avec ID: ${testId}`);

        // Supprimer l'utilisateur test
        await pool.request()
            .input('id', sql.Int, testId)
            .query('DELETE FROM utilisateurs WHERE id = @id');
        console.log('✅ Utilisateur test supprimé');

        await pool.close();
        console.log('');
        console.log('🎉 Tous les tests sont passés avec succès!');
        console.log('✅ Votre base de données SQL Server est prête pour l\'application AMNAL IT');

    } catch (err) {
        console.error('');
        console.error('❌ Erreur de connexion SQL Server:');
        console.error('📋 Détails:', err.message);
        
        if (err.code) {
            console.error('🔍 Code d\'erreur:', err.code);
        }
        
        console.error('');
        console.error('🔧 Solutions possibles:');
        console.error('1. Vérifiez que SQL Server est démarré');
        console.error('2. Vérifiez les paramètres de connexion dans .env');
        console.error('3. Vérifiez que TCP/IP est activé sur le port 1433');
        console.error('4. Vérifiez le pare-feu Windows');
        console.error('5. Vérifiez que l\'utilisateur amnal_user existe');
        console.error('6. Consultez le guide SQL_SERVER_SETUP.md');
        
        process.exit(1);
    }
}

// Gestion des signaux pour fermer proprement la connexion
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du test...');
    await sql.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt du test...');
    await sql.close();
    process.exit(0);
});

// Exécuter le test
testConnection();
