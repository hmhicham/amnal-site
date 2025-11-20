# 🖥️ Système de Gestion IT - AMNAL

Système de gestion des pannes et tickets IT pour l'entreprise AMNAL.

## 📋 Description

Application web complète pour gérer les demandes de support IT:
- **Employés**: Créent des tickets pour leurs problèmes informatiques
- **Administrateurs**: Gèrent et résolvent les tickets

## 🛠️ Technologies

### Frontend
- React 19
- Tailwind CSS 3
- Lucide React (icônes)
- Vite

### Backend
- Node.js + Express
- PostgreSQL 18
- JWT Authentication
- Bcrypt
- Nodemailer

## 📁 Structure du Projet

```
site amnal/
├── frontend/                    # Application React
│   ├── src/
│   │   ├── App.jsx             # Composant principal
│   │   ├── index.css           # Styles Tailwind
│   │   └── main.jsx            # Point d'entrée
│   ├── package.json
│   └── build-production.bat    # Script de build
│
├── systeme-pannes-backend/      # API Node.js
│   ├── server.js               # Serveur Express
│   ├── database_schema_postgres.sql
│   ├── create-users.js         # Script création utilisateurs
│   ├── .env.example            # Template configuration
│   └── start-production.bat    # Script démarrage
│
├── DEPLOYMENT_GUIDE.md          # Guide complet
├── QUICK_START.md               # Guide rapide
└── deploy-to-server.bat         # Script packaging
```

## 🚀 Installation Développement

### Prérequis
- Node.js 18+
- PostgreSQL 18
- npm

### Backend

```bash
cd systeme-pannes-backend
npm install
cp .env.example .env
# Éditer .env avec vos paramètres
node create-users.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🌐 Déploiement Production

### Option 1: Guide Rapide
Suivez: `QUICK_START.md`

### Option 2: Guide Complet
Suivez: `DEPLOYMENT_GUIDE.md`

### Option 3: Script Automatique
Double-cliquez sur: `deploy-to-server.bat`

## 👥 Comptes par Défaut

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@amnal.dz | admin123 |
| Employé | user@amnal.dz | admin123 |

⚠️ **Changez ces mots de passe en production!**

## 📊 Fonctionnalités

### Pour les Employés
- ✅ Créer des tickets de panne
- ✅ Voir l'historique de leurs tickets
- ✅ Suivre le statut de résolution
- ✅ Ajouter des détails et priorités

### Pour les Administrateurs
- ✅ Voir tous les tickets
- ✅ Filtrer par statut (En attente, En cours, Résolu)
- ✅ Mettre à jour le statut des tickets
- ✅ Ajouter des notes de résolution
- ✅ Statistiques en temps réel

## 🔒 Sécurité

- ✅ Authentification JWT
- ✅ Mots de passe hashés (bcrypt)
- ✅ Protection CORS
- ✅ Validation des entrées
- ✅ Requêtes SQL paramétrées (protection SQL injection)

## 📝 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Tickets
- `GET /api/tickets` - Liste des tickets
- `POST /api/tickets` - Créer un ticket
- `PUT /api/tickets/:id/status` - Mettre à jour le statut
- `POST /api/tickets/:id/notes` - Ajouter une note

### Statistiques
- `GET /api/stats` - Statistiques globales

## 🔧 Configuration

### Variables d'Environnement (.env)

```env
PORT=3000
JWT_SECRET=votre_secret_key
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_password
DB_NAME=systeme_pannes_it
SMTP_HOST=smtp.example.com
SMTP_PORT=587
EMAIL_USER=noreply@amnal.dz
EMAIL_PASS=password
```

## 🐛 Dépannage

### Backend ne démarre pas
```bash
cd systeme-pannes-backend
node server.js
# Vérifier les erreurs
```

### Frontend page blanche
- Ouvrir la console (F12)
- Vérifier l'URL du backend dans `App.jsx`
- Vérifier que le backend est accessible

### Erreur PostgreSQL
```bash
# Tester la connexion
node test-connection.js
```

## 📞 Support

Pour toute question:
1. Consultez `DEPLOYMENT_GUIDE.md`
2. Vérifiez les logs: `pm2 logs amnal-backend`
3. Testez la connexion DB: `node test-connection.js`

## 📄 Licence

Propriété de AMNAL - Usage interne uniquement

## 👨‍💻 Développé pour

**AMNAL** - Système de gestion des pannes IT

---

**Version:** 1.0.0  
**Date:** Novembre 2025  
**Stack:** React + Node.js + PostgreSQL
