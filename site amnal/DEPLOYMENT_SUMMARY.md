# 📦 Résumé de Déploiement - Système AMNAL IT

## 🎯 Ce que Vous Avez

Un système complet de gestion des tickets IT avec:
- ✅ Frontend React moderne et responsive
- ✅ Backend Node.js + Express sécurisé
- ✅ Base de données PostgreSQL
- ✅ Authentification JWT
- ✅ 2 rôles: Employés et Administrateurs

---

## 📁 Fichiers Importants Créés

### Documentation
- `README.md` - Vue d'ensemble du projet
- `QUICK_START.md` - Guide rapide (5 étapes)
- `DEPLOYMENT_GUIDE.md` - Guide complet et détaillé
- `PRODUCTION_CHECKLIST.md` - Checklist de validation
- `DEPLOYMENT_SUMMARY.md` - Ce fichier

### Scripts de Déploiement
- `deploy-to-server.bat` - Créer le package de déploiement
- `frontend/build-production.bat` - Builder le frontend
- `systeme-pannes-backend/start-production.bat` - Démarrer le backend

### Configuration
- `frontend/src/config.js` - Configuration de l'URL API
- `frontend/web.config` - Configuration IIS
- `systeme-pannes-backend/.env.example` - Template environnement
- `systeme-pannes-backend/.env.production` - Template production

### Utilitaires
- `systeme-pannes-backend/create-users.js` - Créer utilisateurs
- `systeme-pannes-backend/test-connection.js` - Tester PostgreSQL
- `systeme-pannes-backend/check-tables.js` - Vérifier tables
- `systeme-pannes-backend/check-user-data.js` - Vérifier utilisateurs

---

## 🚀 Pour Déployer: 3 Étapes Simples

### 1️⃣ Préparer (sur votre PC)

```bash
# Éditer la configuration
Ouvrir: frontend/src/config.js
Changer: 'http://VOTRE-SERVEUR-IP:3000/api'

# Créer le package
Double-cliquer: deploy-to-server.bat
```

### 2️⃣ Copier (vers le serveur)

```
Copier deployment-package\ vers:
C:\inetpub\amnal-it\
```

### 3️⃣ Installer (sur le serveur)

```powershell
# Installer prérequis
- Node.js (https://nodejs.org/)
- PostgreSQL (https://www.postgresql.org/)
- PM2: npm install -g pm2 pm2-windows-service

# Configurer DB
psql -U postgres
CREATE DATABASE systeme_pannes_it WITH ENCODING 'UTF8';
\q

cd C:\inetpub\amnal-it\backend
psql -U postgres -d systeme_pannes_it -f database_schema_postgres.sql
node create-users.js

# Démarrer Backend
npm install --production
pm2 start server.js --name amnal-backend
pm2 save

# Configurer IIS
- Créer site web
- Path: C:\inetpub\amnal-it\frontend\dist
- Port: 80
```

---

## 🔧 Configuration Requise

### Avant de Builder le Frontend

**Fichier:** `frontend/src/config.js`

```javascript
API_URL: import.meta.env.PROD 
  ? 'http://192.168.1.100:3000/api'  // ⚠️ CHANGEZ CETTE IP
  : 'http://localhost:3000/api',
```

**Remplacez** `192.168.1.100` par:
- L'adresse IP de votre serveur Windows
- OU le nom de domaine (ex: `http://amnal-server.local:3000/api`)

### Avant de Démarrer le Backend

**Fichier:** `systeme-pannes-backend/.env`

```env
PORT=3000
JWT_SECRET=CHANGEZ_MOI_AVEC_UNE_CLE_LONGUE_ET_ALEATOIRE
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES
DB_NAME=systeme_pannes_it
```

⚠️ **IMPORTANT:**
- Changez `JWT_SECRET` (minimum 32 caractères aléatoires)
- Utilisez votre vrai mot de passe PostgreSQL

---

## 📊 Comptes par Défaut

Après avoir exécuté `node create-users.js`:

| Rôle | Email | Mot de passe | Accès |
|------|-------|--------------|-------|
| Admin | admin@amnal.dz | admin123 | Gestion tickets |
| Employé | user@amnal.dz | admin123 | Création tickets |
| Technicien | technicien@amnal.dz | admin123 | Gestion tickets |

⚠️ **Changez ces mots de passe en production!**

---

## 🌐 URLs d'Accès

Une fois déployé:

- **Frontend:** `http://IP-DU-SERVEUR` ou `http://localhost`
- **Backend API:** `http://IP-DU-SERVEUR:3000/api`
- **Test Backend:** `http://IP-DU-SERVEUR:3000/api/tickets`

---

## ✅ Validation Rapide

### 1. Backend fonctionne?
```powershell
pm2 status
# Doit montrer "amnal-backend" en "online"

pm2 logs amnal-backend
# Doit montrer "Serveur démarré sur le port 3000"
```

### 2. Frontend accessible?
```
Ouvrir navigateur: http://IP-DU-SERVEUR
Doit afficher: Page de login
```

### 3. Connexion fonctionne?
```
Login: admin@amnal.dz
Password: admin123
Doit afficher: Panel d'administration
```

---

## 🆘 Problèmes Courants

### "Cannot connect to backend"
- Vérifier que PM2 tourne: `pm2 status`
- Vérifier les logs: `pm2 logs amnal-backend`
- Vérifier le pare-feu (port 3000 ouvert)

### "Page blanche" sur le frontend
- Ouvrir F12 → Console
- Vérifier l'URL API dans `config.js`
- Vérifier que le backend est accessible

### "Database connection failed"
- Vérifier PostgreSQL: `Get-Service postgresql-x64-18`
- Tester: `node test-connection.js`
- Vérifier `.env` (DB_PASSWORD correct?)

---

## 📞 Commandes Utiles

```powershell
# Voir les logs
pm2 logs amnal-backend

# Redémarrer
pm2 restart amnal-backend

# Arrêter
pm2 stop amnal-backend

# Statut
pm2 status

# Tester la DB
cd C:\inetpub\amnal-it\backend
node test-connection.js
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez:

1. **QUICK_START.md** - Guide rapide (recommandé pour commencer)
2. **DEPLOYMENT_GUIDE.md** - Guide complet avec tous les détails
3. **PRODUCTION_CHECKLIST.md** - Liste de vérification complète
4. **README.md** - Vue d'ensemble technique

---

## 🎉 Félicitations!

Votre système AMNAL IT est prêt à être déployé!

**Prochaines étapes:**
1. Éditer `frontend/src/config.js` avec l'IP du serveur
2. Exécuter `deploy-to-server.bat`
3. Copier `deployment-package\` vers le serveur
4. Suivre `QUICK_START.md`

---

**Version:** 1.0.0  
**Date:** Novembre 2025  
**Support:** Consultez DEPLOYMENT_GUIDE.md pour le dépannage
