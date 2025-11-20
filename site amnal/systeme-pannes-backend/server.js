// server_sqlserver.js - Backend Node.js/Express with SQL Server
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_key_ici';

// Middleware - Allow all origins for now (can be restricted later)
app.use(cors({
  origin: true,  // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Additional CORS middleware to ensure headers are always present
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());

// Configuration de la base de données SQL Server
const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'systeme_pannes_it',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Variable globale pour la connexion
let pool;

// Fonction de connexion à SQL Server
async function connectToDatabase() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connecté à SQL Server');
    return pool;
  } catch (err) {
    console.error('❌ Erreur SQL Server:', err);
    throw err;
  }
}

// Configuration Nodemailer pour les emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// ============= ROUTES D'AUTHENTIFICATION =============

// Inscription utilisateur
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nom, prenom, email, password, role, departement } = req.body;
    
    // Vérifier si l'email existe déjà
    const request = pool.request();
    request.input('email', sql.NVarChar, email);
    const existing = await request.query('SELECT id FROM utilisateurs WHERE email = @email');
    
    if (existing.recordset.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insérer l'utilisateur
    const insertRequest = pool.request();
    insertRequest.input('nom', sql.NVarChar, nom);
    insertRequest.input('prenom', sql.NVarChar, prenom || 'Prénom');
    insertRequest.input('email', sql.NVarChar, email);
    insertRequest.input('password', sql.NVarChar, hashedPassword);
    insertRequest.input('role', sql.NVarChar, role || 'user');
    insertRequest.input('departement', sql.NVarChar, departement);
    
    const result = await insertRequest.query(`
      INSERT INTO utilisateurs (nom, prenom, email, password, role, departement) 
      OUTPUT INSERTED.id
      VALUES (@nom, @prenom, @email, @password, @role, @departement)
    `);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId: result.recordset[0].id
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion utilisateur
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Rechercher l'utilisateur
    const request = pool.request();
    request.input('email', sql.NVarChar, email);
    const result = await request.query('SELECT * FROM utilisateurs WHERE email = @email AND actif = 1');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.recordset[0];
    
    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour la date de dernière connexion
    const updateRequest = pool.request();
    updateRequest.input('userId', sql.Int, user.id);
    await updateRequest.query('UPDATE utilisateurs SET dernier_login = GETDATE() WHERE id = @userId');

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        departement: user.departement
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les informations de l'utilisateur connecté
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    request.input('userId', sql.Int, req.user.userId);
    const result = await request.query('SELECT nom, prenom, email, role, departement FROM utilisateurs WHERE id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      user: result.recordset[0]
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============= ROUTES DES TICKETS =============

// Récupérer tous les tickets
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    
    let query = `
      SELECT 
        t.id, t.type_panne, t.materiel, t.priorite, t.statut, 
        t.description, t.notes_technicien, t.date_creation, 
        t.date_modification, t.date_resolution,
        u.nom as utilisateur_nom, u.email as utilisateur_email,
        u.departement as utilisateur_departement,
        tech.nom as technicien_nom, tech.email as technicien_email
      FROM tickets t
      INNER JOIN utilisateurs u ON t.utilisateur_id = u.id
      LEFT JOIN utilisateurs tech ON t.technicien_id = tech.id
    `;
    
    // Si l'utilisateur n'est pas admin, ne montrer que ses tickets
    if (req.user.role !== 'admin' && req.user.role !== 'technicien') {
      query += ' WHERE t.utilisateur_id = @userId';
      request.input('userId', sql.Int, req.user.userId);
    }
    
    query += ' ORDER BY t.date_creation DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);

  } catch (error) {
    console.error('Erreur récupération tickets:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { type_panne, materiel, priorite, description } = req.body;
    
    const request = pool.request();
    request.input('utilisateur_id', sql.Int, req.user.userId);
    request.input('type_panne', sql.NVarChar, type_panne);
    request.input('materiel', sql.NVarChar, materiel);
    request.input('priorite', sql.NVarChar, priorite || 'normale');
    request.input('description', sql.NText, description);
    
    const result = await request.query(`
      INSERT INTO tickets (utilisateur_id, type_panne, materiel, priorite, description)
      OUTPUT INSERTED.id
      VALUES (@utilisateur_id, @type_panne, @materiel, @priorite, @description)
    `);

    res.status(201).json({
      message: 'Ticket créé avec succès',
      ticketId: result.recordset[0].id
    });

  } catch (error) {
    console.error('Erreur création ticket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'un ticket
app.put('/api/tickets/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, notes_technicien } = req.body;
    
    // Vérifier que l'utilisateur est technicien (seuls les techniciens peuvent modifier les tickets)
    if (req.user.role !== 'technicien') {
      return res.status(403).json({ error: 'Accès non autorisé - Seuls les techniciens peuvent modifier les tickets' });
    }
    
    const request = pool.request();
    request.input('id', sql.Int, id);
    request.input('statut', sql.NVarChar, statut);
    request.input('notes_technicien', sql.NText, notes_technicien);
    request.input('technicien_id', sql.Int, req.user.userId);
    
    // Construire la requête de mise à jour avec gestion des dates
    let updateQuery = `
      UPDATE tickets 
      SET statut = @statut, 
          notes_technicien = @notes_technicien,
          technicien_id = @technicien_id,
          date_modification = GETDATE()`;
    
    // Si le statut devient 'resolu', mettre à jour la date de résolution
    if (statut === 'resolu') {
      updateQuery += `, date_resolution = GETDATE()`;
    }
    
    updateQuery += ` WHERE id = @id`;
    
    await request.query(updateQuery);

    res.json({ message: 'Statut mis à jour avec succès' });

  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============= ROUTES DES STATISTIQUES =============

// Récupérer les statistiques
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est technicien ou user (plus d'admin)
    // Les techniciens et utilisateurs peuvent voir les stats générales
    if (req.user.role !== 'technicien' && req.user.role !== 'user') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const request = pool.request();
    const result = await request.query(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as tickets_en_attente,
        SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as tickets_en_cours,
        SUM(CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END) as tickets_resolus,
        AVG(CASE 
          WHEN statut = 'resolu' AND date_resolution IS NOT NULL 
          THEN DATEDIFF(MINUTE, date_creation, date_resolution)
          ELSE NULL 
        END) as temps_resolution_moyen
      FROM tickets
    `);

    res.json(result.recordset[0]);

  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============= ROUTE DE TEST =============

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API AMNAL IT fonctionne!', 
    timestamp: new Date().toISOString(),
    database: 'SQL Server'
  });
});

// ============= DÉMARRAGE DU SERVEUR =============

async function startServer() {
  try {
    // Se connecter à la base de données
    await connectToDatabase();
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 API accessible sur: http://localhost:${PORT}/api`);
      console.log(`🗄️ Base de données: ${dbConfig.database} sur ${dbConfig.server}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
}

// Gestion des signaux pour fermer proprement
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  if (pool) {
    await sql.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  if (pool) {
    await sql.close();
  }
  process.exit(0);
});

// Démarrer le serveur
startServer();
